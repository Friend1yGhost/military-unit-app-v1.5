import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, AlertCircle, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ru } from "date-fns/locale";

const MyDuties = () => {
  const [duties, setDuties] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [allDuties, setAllDuties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const [dutiesRes, groupsRes, allDutiesRes, usersRes] = await Promise.all([
        axios.get(`${API}/duties/my`, config),
        axios.get(`${API}/groups/my`, config),
        axios.get(`${API}/duties`, config),
        axios.get(`${API}/users`, config).catch(() => ({ data: [] }))
      ]);

      setDuties(dutiesRes.data);
      setMyGroups(groupsRes.data);
      setAllDuties(allDutiesRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const isUpcoming = (shiftStart) => {
    return new Date(shiftStart) > new Date();
  };

  const isActive = (shiftStart, shiftEnd) => {
    const now = new Date();
    return new Date(shiftStart) <= now && new Date(shiftEnd) >= now;
  };

  const getDutiesForUserAndDay = (userId, date) => {
    return allDuties.filter(duty => {
      const dutyDate = new Date(duty.shift_start);
      return duty.user_id === userId && isSameDay(dutyDate, date);
    });
  };

  const renderMonthSchedule = (group) => {
    const currentDate = new Date();
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const groupMembers = users.filter(u => group.member_ids?.includes(u.id));

    // Group days by weeks for better display
    const weeks = [];
    let currentWeek = [];
    
    days.forEach((day, idx) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || idx === days.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return (
      <div className="overflow-x-auto">
        <div className="mb-4 p-3 bg-military-olive rounded-lg">
          <h3 className="text-military-gold font-bold text-lg text-center">
            {format(currentDate, "LLLL yyyy", { locale: ru })}
          </h3>
        </div>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-military-olive">
              <th className="border border-military-dark p-3 text-military-light text-left sticky left-0 bg-military-olive z-10 min-w-[150px]">
                Участник
              </th>
              {days.map((day, idx) => (
                <th key={idx} className="border border-military-dark p-2 text-military-light text-center min-w-[100px]">
                  <div className="text-xs font-bold">{format(day, "EEE", { locale: ru })}</div>
                  <div className="text-lg font-bold">{format(day, "dd", { locale: ru })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupMembers.map((member) => (
              <tr key={member.id} className="hover:bg-military-olive/30 transition-colors">
                <td className="border border-military-olive p-3 text-military-light font-semibold sticky left-0 bg-military-green z-10">
                  {member.full_name}
                  {member.id === user.id && (
                    <span className="ml-2 text-xs text-military-gold">(Вы)</span>
                  )}
                </td>
                {days.map((day, dayIdx) => {
                  const dayDuties = getDutiesForUserAndDay(member.id, day);
                  return (
                    <td key={dayIdx} className="border border-military-olive p-2 text-center align-top">
                      {dayDuties.length > 0 ? (
                        <div className="space-y-1">
                          {dayDuties.map((duty, dutyIdx) => (
                            <div
                              key={dutyIdx}
                              className={`text-xs p-2 rounded ${
                                member.id === user.id
                                  ? "bg-military-gold text-military-dark font-bold"
                                  : "bg-military-dark text-military-light"
                              }`}
                              title={`${duty.duty_type} - ${duty.position}`}
                            >
                              <div className="font-semibold">{duty.duty_type}</div>
                              <div className="text-[10px] opacity-80">{duty.position}</div>
                              <div className="text-[10px] mt-1">
                                {format(new Date(duty.shift_start), "HH:mm")} - {format(new Date(duty.shift_end), "HH:mm")}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-military-accent text-xs">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {groupMembers.length === 0 && (
              <tr>
                <td colSpan={8} className="border border-military-olive p-6 text-center text-military-accent">
                  В группе пока нет участников
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-military-dark py-12">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-military-gold mb-4 text-center">
            Мои Наряды
          </h1>
          <p className="text-military-accent text-center text-lg">
            {user?.full_name}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-military-light text-xl">Загрузка...</div>
          </div>
        ) : (
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-military-green mb-8">
              <TabsTrigger 
                value="personal" 
                className="data-[state=active]:bg-military-olive data-[state=active]:text-military-gold"
                data-testid="personal-duties-tab"
              >
                Мои Наряды
              </TabsTrigger>
              <TabsTrigger 
                value="group" 
                className="data-[state=active]:bg-military-olive data-[state=active]:text-military-gold"
                data-testid="group-schedule-tab"
              >
                <Users className="w-4 h-4 mr-2" />
                График Группы
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              {duties.length === 0 ? (
                <Card className="bg-military-green border-2 border-military-olive">
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="w-16 h-16 text-military-accent mx-auto mb-4" />
                    <p className="text-military-light text-xl">У вас пока нет назначенных нарядов</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {duties.map((duty) => {
              const upcoming = isUpcoming(duty.shift_start);
              const active = isActive(duty.shift_start, duty.shift_end);

              return (
                <Card
                  key={duty.id}
                  className={`bg-military-green border-2 transition-all duration-300 hover:shadow-xl ${
                    active
                      ? "border-military-gold shadow-lg shadow-military-gold/50"
                      : upcoming
                      ? "border-military-accent"
                      : "border-military-olive"
                  }`}
                  data-testid={`duty-card-${duty.id}`}
                >
                  <CardHeader className="border-b border-military-olive pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-military-gold text-xl" data-testid={`duty-type-${duty.id}`}>
                        {duty.duty_type}
                      </CardTitle>
                      {active && (
                        <span className="px-3 py-1 bg-military-gold text-military-dark text-xs font-bold rounded-full animate-pulse">
                          АКТИВНО
                        </span>
                      )}
                      {upcoming && !active && (
                        <span className="px-3 py-1 bg-military-accent text-military-dark text-xs font-bold rounded-full">
                          СКОРО
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-military-accent text-sm">
                      <MapPin className="w-4 h-4" />
                      <span data-testid={`duty-position-${duty.id}`}>{duty.position}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start space-x-2 text-military-light">
                      <Calendar className="w-4 h-4 mt-1 text-military-accent" />
                      <div className="text-sm">
                        <p className="font-semibold mb-1">Начало:</p>
                        <p data-testid={`duty-start-${duty.id}`}>
                          {format(new Date(duty.shift_start), "dd MMMM yyyy, HH:mm", { locale: ru })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2 text-military-light">
                      <Clock className="w-4 h-4 mt-1 text-military-accent" />
                      <div className="text-sm">
                        <p className="font-semibold mb-1">Конец:</p>
                        <p data-testid={`duty-end-${duty.id}`}>
                          {format(new Date(duty.shift_end), "dd MMMM yyyy, HH:mm", { locale: ru })}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-military-olive">
                      <p className="text-military-accent text-xs font-semibold mb-1">Ротация:</p>
                      <p className="text-military-light text-sm" data-testid={`duty-rotation-${duty.id}`}>
                        {duty.rotation_cycle === "daily" && "Ежедневно"}
                        {duty.rotation_cycle === "weekly" && "Еженедельно"}
                        {duty.rotation_cycle === "monthly" && "Ежемесячно"}
                      </p>
                    </div>

                    {duty.notes && (
                      <div className="pt-2 border-t border-military-olive">
                        <p className="text-military-accent text-xs font-semibold mb-1">Примечания:</p>
                        <p className="text-military-light text-sm italic" data-testid={`duty-notes-${duty.id}`}>{duty.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
              )}
            </TabsContent>

            <TabsContent value="group" className="space-y-6">
              {myGroups.length === 0 ? (
                <Card className="bg-military-green border-2 border-military-olive">
                  <CardContent className="py-12 text-center">
                    <Users className="w-16 h-16 text-military-accent mx-auto mb-4" />
                    <p className="text-military-light text-xl mb-2">Вы не состоите ни в одной группе</p>
                    <p className="text-military-accent">Обратитесь к администратору для добавления в подразделение</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {myGroups.map((group) => (
                    <Card key={group.id} className="bg-military-green border-2 border-military-olive">
                      <CardHeader className="border-b border-military-olive">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-military-gold text-2xl mb-2">
                              {group.name}
                            </CardTitle>
                            {group.description && (
                              <p className="text-military-light text-sm">{group.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2 text-military-accent">
                              <Users className="w-5 h-5" />
                              <span className="font-semibold">{group.member_ids?.length || 0} участников</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <h3 className="text-military-gold font-semibold mb-4 text-lg">
                          График Нарядов на Неделю
                        </h3>
                        {renderWeekSchedule(group)}
                        <div className="mt-4 p-4 bg-military-dark rounded-lg border border-military-olive">
                          <p className="text-military-accent text-sm">
                            <span className="font-semibold">Легенда:</span> Ваши наряды выделены{" "}
                            <span className="inline-block px-2 py-1 bg-military-gold text-military-dark text-xs font-bold rounded">
                              золотым цветом
                            </span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default MyDuties;