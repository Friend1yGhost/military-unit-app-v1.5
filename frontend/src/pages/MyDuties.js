import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const MyDuties = () => {
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchDuties();
  }, []);

  const fetchDuties = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.get(`${API}/duties/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDuties(response.data);
    } catch (error) {
      console.error("Error fetching duties:", error);
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
        ) : duties.length === 0 ? (
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
      </div>
    </div>
  );
};

export default MyDuties;