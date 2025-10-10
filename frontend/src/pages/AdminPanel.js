import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Plus, Calendar, User, Settings as SettingsIcon, Edit, X, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RANK_CATEGORIES = {
  "Рядовий": ["солдат", "старший солдат"],
  "Сержантський склад": [
    "молодший сержант",
    "сержант",
    "старший сержант",
    "головний сержант",
    "штаб-сержант",
    "майстер-сержант",
    "старший майстер-сержант",
    "головний майстер-сержант"
  ],
  "Молодший офіцерський склад": [
    "молодший лейтенант",
    "лейтенант",
    "старший лейтенант",
    "капітан"
  ],
  "Старший офіцерський склад": [
    "майор",
    "підполковник",
    "полковник"
  ]
};

const AdminPanel = () => {
  const [news, setNews] = useState([]);
  const [duties, setDuties] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [settings, setSettings] = useState({ unit_name: "", unit_subtitle: "", unit_icon: "", news_title: "", news_subtitle: "" });
  const [newsForm, setNewsForm] = useState({ title: "", content: "", image_url: "" });
  const [editingNews, setEditingNews] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingDuty, setEditingDuty] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [rankCategory, setRankCategory] = useState("");
  const [groupForm, setGroupForm] = useState({ name: "", description: "", member_ids: [] });
  const [userForm, setUserForm] = useState({ full_name: "", email: "", password: "", rank: "", role: "user" });
  const [dutyForm, setDutyForm] = useState({
    user_id: "",
    duty_type: "",
    position: "",
    shift_start: "",
    shift_end: "",
    rotation_cycle: "weekly",
    notes: ""
  });
  const [selectedDates, setSelectedDates] = useState([]);
  const [bulkMode, setBulkMode] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const [newsRes, dutiesRes, usersRes, groupsRes, settingsRes] = await Promise.all([
        axios.get(`${API}/news`),
        axios.get(`${API}/duties`, config),
        axios.get(`${API}/users`, config),
        axios.get(`${API}/groups`, config),
        axios.get(`${API}/settings`)
      ]);

      setNews(newsRes.data);
      setDuties(dutiesRes.data);
      setUsers(usersRes.data);
      setGroups(groupsRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      toast.error("Ошибка загрузки данных");
    }
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      if (editingNews) {
        // Update existing news
        await axios.put(`${API}/news/${editingNews.id}`, newsForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Новость обновлена!");
        setEditingNews(null);
      } else {
        // Create new news
        await axios.post(`${API}/news`, newsForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Новость опубликована!");
      }
      
      setNewsForm({ title: "", content: "", image_url: "" });
      fetchData();
    } catch (error) {
      toast.error(editingNews ? "Ошибка обновления новости" : "Ошибка публикации новости");
    }
  };

  const handleEditNews = (newsItem) => {
    setEditingNews(newsItem);
    setNewsForm({
      title: newsItem.title,
      content: newsItem.content,
      image_url: newsItem.image_url || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingNews(null);
    setNewsForm({ title: "", content: "", image_url: "" });
  };

  const handleSyncArmyInform = async () => {
    const token = localStorage.getItem("token");
    
    try {
      const response = await axios.post(`${API}/news/sync-armyinform`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(response.data.message || "Новости синхронизированы!");
      fetchData();
    } catch (error) {
      toast.error("Ошибка синхронизации новостей");
    }
  };

  const handleDeleteNews = async (id) => {
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`${API}/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Новость удалена");
      fetchData();
    } catch (error) {
      toast.error("Ошибка удаления новости");
    }
  };

  const handleDutySubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      if (editingDuty) {
        // Update single duty
        await axios.put(`${API}/duties/${editingDuty.id}`, dutyForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Наряд оновлено!");
        setEditingDuty(null);
      } else if (bulkMode && selectedDates.length > 0) {
        // Create multiple duties for selected dates
        const startTime = dutyForm.shift_start.split('T')[1].substring(0, 5);
        const endTime = dutyForm.shift_end.split('T')[1].substring(0, 5);
        
        await axios.post(`${API}/duties/bulk`, {
          user_id: dutyForm.user_id,
          duty_type: dutyForm.duty_type,
          position: dutyForm.position,
          dates: selectedDates,
          shift_start_time: startTime,
          shift_end_time: endTime,
          rotation_cycle: dutyForm.rotation_cycle,
          notes: dutyForm.notes
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`Створено ${selectedDates.length} нарядів!`);
      } else {
        // Create single duty
        await axios.post(`${API}/duties`, dutyForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Наряд створено!");
      }

      setDutyForm({
        user_id: "",
        duty_type: "",
        position: "",
        shift_start: "",
        shift_end: "",
        rotation_cycle: "weekly",
        notes: ""
      });
      setSelectedDates([]);
      fetchData();
    } catch (error) {
      toast.error("Ошибка создания наряда");
    }
  };

  const handleEditDuty = (dutyItem) => {
    setEditingDuty(dutyItem);
    setDutyForm({
      user_id: dutyItem.user_id,
      duty_type: dutyItem.duty_type,
      position: dutyItem.position,
      shift_start: new Date(dutyItem.shift_start).toISOString().slice(0, 16),
      shift_end: new Date(dutyItem.shift_end).toISOString().slice(0, 16),
      rotation_cycle: dutyItem.rotation_cycle,
      notes: dutyItem.notes || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDuty = async (id) => {
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`${API}/duties/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Наряд удален");
      fetchData();
    } catch (error) {
      toast.error("Ошибка удаления наряда");
    }
  };

  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.put(`${API}/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Настройки обновлены!");
      window.location.reload();
    } catch (error) {
      toast.error("Ошибка обновления настроек");
    }
  };

  // User management handlers
  const handleEditUser = (userItem) => {
    setEditingUser(userItem);
    setCreatingUser(false);
    setRankCategory("");
    setUserForm({
      full_name: userItem.full_name,
      email: userItem.email,
      password: "",
      rank: userItem.rank || "",
      role: userItem.role
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      if (editingUser) {
        // Update existing user
        await axios.put(`${API}/users/${editingUser.id}`, userForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Користувача оновлено!");
        setEditingUser(null);
      } else {
        // Create new user
        await axios.post(`${API}/auth/register`, {
          ...userForm,
          email: userForm.email || `user_${Date.now()}@military.local` // Fallback email
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Користувача створено!");
        setCreatingUser(false);
      }

      setUserForm({ full_name: "", email: "", password: "", rank: "", role: "user" });
      setRankCategory("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Помилка");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Удалить этого пользователя?")) return;
    
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Пользователь удален");
      fetchData();
    } catch (error) {
      toast.error("Ошибка удаления пользователя");
    }
  };

  // Group management handlers
  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      if (editingGroup) {
        await axios.put(`${API}/groups/${editingGroup.id}`, groupForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Группа обновлена!");
        setEditingGroup(null);
      } else {
        await axios.post(`${API}/groups`, { name: groupForm.name, description: groupForm.description }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Группа создана!");
      }
      
      setGroupForm({ name: "", description: "", member_ids: [] });
      fetchData();
    } catch (error) {
      toast.error(editingGroup ? "Ошибка обновления группы" : "Ошибка создания группы");
    }
  };

  const handleEditGroup = (groupItem) => {
    setEditingGroup(groupItem);
    setGroupForm({
      name: groupItem.name,
      description: groupItem.description || "",
      member_ids: groupItem.member_ids || []
    });
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Удалить эту группу?")) return;
    
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Группа удалена");
      fetchData();
    } catch (error) {
      toast.error("Ошибка удаления группы");
    }
  };

  const toggleGroupMember = (userId) => {
    const members = [...groupForm.member_ids];
    const index = members.indexOf(userId);
    
    if (index > -1) {
      members.splice(index, 1);
    } else {
      members.push(userId);
    }
    
    setGroupForm({ ...groupForm, member_ids: members });
  };

  return (
    <div className="min-h-screen bg-military-dark py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-military-gold mb-8 text-center">
          Панель Администратора
        </h1>

        <Tabs defaultValue="news" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 bg-military-green mb-8">
            <TabsTrigger value="news" className="data-[state=active]:bg-military-olive data-[state=active]:text-military-gold text-xs sm:text-sm" data-testid="news-tab">
              Новости
            </TabsTrigger>
            <TabsTrigger value="duties" className="data-[state=active]:bg-military-olive data-[state=active]:text-military-gold text-xs sm:text-sm" data-testid="duties-tab">
              Наряды
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-military-olive data-[state=active]:text-military-gold text-xs sm:text-sm" data-testid="users-tab">
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-military-olive data-[state=active]:text-military-gold text-xs sm:text-sm" data-testid="groups-tab">
              Группы
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-military-olive data-[state=active]:text-military-gold text-xs sm:text-sm" data-testid="settings-tab">
              Настройки
            </TabsTrigger>
          </TabsList>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-8">
            <Card className="bg-military-green border-2 border-military-olive">
              <CardHeader className="border-b border-military-olive">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-military-gold flex items-center">
                    {editingNews ? (
                      <>
                        <Edit className="w-6 h-6 mr-2" />
                        Редактировать Новость
                      </>
                    ) : (
                      <>
                        <Plus className="w-6 h-6 mr-2" />
                        Опубликовать Новость
                      </>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {editingNews && (
                      <Button
                        type="button"
                        onClick={handleCancelEdit}
                        variant="ghost"
                        className="text-military-light hover:text-military-accent"
                        data-testid="cancel-edit-btn"
                      >
                        <X className="w-5 h-5 mr-1" />
                        Отменить
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={handleSyncArmyInform}
                      variant="outline"
                      className="border-military-accent text-military-accent hover:bg-military-accent hover:text-military-dark"
                      data-testid="sync-armyinform-btn"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Синхронізувати з ArmyInform
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleNewsSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-military-light">Заголовок</Label>
                    <Input
                      id="title"
                      value={newsForm.title}
                      onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                      className="bg-military-dark border-military-olive text-military-light"
                      required
                      data-testid="news-title-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-military-light">Содержание</Label>
                    <Textarea
                      id="content"
                      value={newsForm.content}
                      onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                      className="bg-military-dark border-military-olive text-military-light min-h-[150px]"
                      required
                      data-testid="news-content-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image_url" className="text-military-light">URL Изображения (необязательно)</Label>
                    <Input
                      id="image_url"
                      value={newsForm.image_url}
                      onChange={(e) => setNewsForm({ ...newsForm, image_url: e.target.value })}
                      className="bg-military-dark border-military-olive text-military-light"
                      data-testid="news-image-input"
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-military-accent text-sm">Рекомендуемый размер: 800x600px или больше</p>
                  </div>

                  <Button type="submit" className="bg-military-olive hover:bg-military-accent text-military-dark font-bold" data-testid="publish-news-btn">
                    {editingNews ? "Обновить" : "Опубликовать"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-military-green border-2 border-military-olive">
              <CardHeader className="border-b border-military-olive">
                <CardTitle className="text-military-gold">Опубликованные Новости</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {news.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 bg-military-dark rounded-lg border border-military-olive"
                      data-testid={`admin-news-item-${item.id}`}
                    >
                      <div className="flex-1">
                        <h3 className="text-military-gold font-bold text-lg mb-2">{item.title}</h3>
                        <p className="text-military-light text-sm mb-2">{item.content}</p>
                        <p className="text-military-accent text-xs">Автор: {item.author_name}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleEditNews(item)}
                          variant="outline"
                          size="sm"
                          className="border-military-olive text-military-light hover:bg-military-olive hover:text-military-gold"
                          data-testid={`edit-news-btn-${item.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteNews(item.id)}
                          variant="destructive"
                          size="sm"
                          data-testid={`delete-news-btn-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Duties Tab */}
          <TabsContent value="duties" className="space-y-8">
            <Card className="bg-military-green border-2 border-military-olive">
              <CardHeader className="border-b border-military-olive">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-military-gold flex items-center">
                    {editingDuty ? (
                      <>
                        <Edit className="w-6 h-6 mr-2" />
                        Редактировать Наряд
                      </>
                    ) : (
                      <>
                        <Plus className="w-6 h-6 mr-2" />
                        Создать Наряд
                      </>
                    )}
                  </CardTitle>
                  {editingDuty && (
                    <Button
                      type="button"
                      onClick={() => {
                        setEditingDuty(null);
                        setDutyForm({ user_id: "", duty_type: "", position: "", shift_start: "", shift_end: "", rotation_cycle: "weekly", notes: "" });
                      }}
                      variant="ghost"
                      className="text-military-light hover:text-military-accent"
                    >
                      <X className="w-5 h-5 mr-1" />
                      Отменить
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleDutySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user" className="text-military-light">Пользователь</Label>
                    <Select value={dutyForm.user_id} onValueChange={(value) => setDutyForm({ ...dutyForm, user_id: value })}>
                      <SelectTrigger className="bg-military-dark border-military-olive text-military-light" data-testid="duty-user-select">
                        <SelectValue placeholder="Выберите пользователя" />
                      </SelectTrigger>
                      <SelectContent className="bg-military-dark border-military-olive">
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id} className="text-military-light">
                            {user.full_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duty_type" className="text-military-light">Тип Наряда</Label>
                      <Input
                        id="duty_type"
                        value={dutyForm.duty_type}
                        onChange={(e) => setDutyForm({ ...dutyForm, duty_type: e.target.value })}
                        placeholder="Караул, Патруль, Кухня..."
                        className="bg-military-dark border-military-olive text-military-light"
                        required
                        data-testid="duty-type-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position" className="text-military-light">Позиция</Label>
                      <Input
                        id="position"
                        value={dutyForm.position}
                        onChange={(e) => setDutyForm({ ...dutyForm, position: e.target.value })}
                        placeholder="Пост №1, Кухня..."
                        className="bg-military-dark border-military-olive text-military-light"
                        required
                        data-testid="duty-position-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shift_start" className="text-military-light">Начало Смены</Label>
                      <Input
                        id="shift_start"
                        type="datetime-local"
                        value={dutyForm.shift_start}
                        onChange={(e) => setDutyForm({ ...dutyForm, shift_start: e.target.value })}
                        className="bg-military-dark border-military-olive text-military-light"
                        required
                        data-testid="duty-start-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shift_end" className="text-military-light">Конец Смены</Label>
                      <Input
                        id="shift_end"
                        type="datetime-local"
                        value={dutyForm.shift_end}
                        onChange={(e) => setDutyForm({ ...dutyForm, shift_end: e.target.value })}
                        className="bg-military-dark border-military-olive text-military-light"
                        required
                        data-testid="duty-end-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rotation" className="text-military-light">Цикл Ротации</Label>
                    <Select value={dutyForm.rotation_cycle} onValueChange={(value) => setDutyForm({ ...dutyForm, rotation_cycle: value })}>
                      <SelectTrigger className="bg-military-dark border-military-olive text-military-light" data-testid="duty-rotation-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-military-dark border-military-olive">
                        <SelectItem value="daily" className="text-military-light">Ежедневно</SelectItem>
                        <SelectItem value="weekly" className="text-military-light">Еженедельно</SelectItem>
                        <SelectItem value="monthly" className="text-military-light">Ежемесячно</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-military-light">Примечания</Label>
                    <Textarea
                      id="notes"
                      value={dutyForm.notes}
                      onChange={(e) => setDutyForm({ ...dutyForm, notes: e.target.value })}
                      className="bg-military-dark border-military-olive text-military-light"
                      data-testid="duty-notes-input"
                    />
                  </div>

                  <Button type="submit" className="bg-military-olive hover:bg-military-accent text-military-dark font-bold" data-testid="create-duty-btn">
                    Создать Наряд
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-military-green border-2 border-military-olive">
              <CardHeader className="border-b border-military-olive">
                <CardTitle className="text-military-gold">Все Наряды</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {duties.map((duty) => (
                    <div
                      key={duty.id}
                      className="flex items-start justify-between p-4 bg-military-dark rounded-lg border border-military-olive"
                      data-testid={`admin-duty-item-${duty.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-military-gold" />
                          <h3 className="text-military-gold font-bold">{duty.user_name}</h3>
                        </div>
                        <p className="text-military-light text-sm mb-1">
                          <span className="font-semibold">Тип:</span> {duty.duty_type} | <span className="font-semibold">Позиция:</span> {duty.position}
                        </p>
                        <p className="text-military-accent text-xs">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(duty.shift_start).toLocaleString("ru")} - {new Date(duty.shift_end).toLocaleString("ru")}
                        </p>
                        {duty.notes && <p className="text-military-light text-xs mt-2 italic">{duty.notes}</p>}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleEditDuty(duty)}
                          variant="outline"
                          size="sm"
                          className="border-military-olive text-military-light hover:bg-military-olive hover:text-military-gold"
                          data-testid={`edit-duty-btn-${duty.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteDuty(duty.id)}
                          variant="destructive"
                          size="sm"
                          data-testid={`delete-duty-btn-${duty.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-8">
            {(editingUser || creatingUser) && (
              <Card className="bg-military-green border-2 border-military-olive">
                <CardHeader className="border-b border-military-olive">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-military-gold flex items-center">
                      {editingUser ? (
                        <>
                          <Edit className="w-6 h-6 mr-2" />
                          Редагувати Користувача
                        </>
                      ) : (
                        <>
                          <Plus className="w-6 h-6 mr-2" />
                          Створити Користувача
                        </>
                      )}
                    </CardTitle>
                    <Button
                      type="button"
                      onClick={() => {
                        setEditingUser(null);
                        setCreatingUser(false);
                        setUserForm({ full_name: "", email: "", password: "", rank: "", role: "user" });
                        setRankCategory("");
                      }}
                      variant="ghost"
                      className="text-military-light hover:text-military-accent"
                    >
                      <X className="w-5 h-5 mr-1" />
                      Отменить
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="user_full_name" className="text-military-light">Полное Имя</Label>
                        <Input
                          id="user_full_name"
                          value={userForm.full_name}
                          onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                          className="bg-military-dark border-military-olive text-military-light"
                          required
                          data-testid="user-name-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="user_email" className="text-military-light">
                          Email {!editingUser && <span className="text-xs text-military-accent">(необов'язково)</span>}
                        </Label>
                        <Input
                          id="user_email"
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          className="bg-military-dark border-military-olive text-military-light"
                          required={!!editingUser}
                          placeholder={!editingUser ? "Залишіть порожнім для авто-генерації" : ""}
                          data-testid="user-email-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 p-4 bg-military-dark rounded-lg border border-military-olive">
                      <div className="space-y-2">
                        <Label className="text-military-light">Категорія Звання</Label>
                        <Select 
                          value={rankCategory} 
                          onValueChange={(value) => {
                            setRankCategory(value);
                            setUserForm({ ...userForm, rank: "" });
                          }}
                        >
                          <SelectTrigger className="bg-military-green border-military-olive text-military-light">
                            <SelectValue placeholder="Оберіть категорію" />
                          </SelectTrigger>
                          <SelectContent className="bg-military-dark border-military-olive">
                            {Object.keys(RANK_CATEGORIES).map((category) => (
                              <SelectItem key={category} value={category} className="text-military-light">
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {rankCategory && (
                        <div className="space-y-2">
                          <Label className="text-military-light">Військове Звання</Label>
                          <Select 
                            value={userForm.rank} 
                            onValueChange={(value) => setUserForm({ ...userForm, rank: value })}
                          >
                            <SelectTrigger className="bg-military-green border-military-olive text-military-light">
                              <SelectValue placeholder="Оберіть звання" />
                            </SelectTrigger>
                            <SelectContent className="bg-military-dark border-military-olive">
                              {RANK_CATEGORIES[rankCategory].map((rank) => (
                                <SelectItem key={rank} value={rank} className="text-military-light">
                                  {rank}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {userForm.rank && (
                        <div className="p-2 bg-military-olive rounded">
                          <p className="text-military-dark text-sm">
                            <span className="font-semibold">Обране:</span> {userForm.rank}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="user_password" className="text-military-light">Новый Пароль (необязательно)</Label>
                        <Input
                          id="user_password"
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          className="bg-military-dark border-military-olive text-military-light"
                          placeholder="Оставьте пустым, чтобы не менять"
                          data-testid="user-password-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="user_role" className="text-military-light">Роль</Label>
                        <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                          <SelectTrigger className="bg-military-dark border-military-olive text-military-light" data-testid="user-role-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-military-dark border-military-olive">
                            <SelectItem value="user" className="text-military-light">Пользователь</SelectItem>
                            <SelectItem value="admin" className="text-military-light">Администратор</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button type="submit" className="bg-military-olive hover:bg-military-accent text-military-dark font-bold" data-testid="save-user-btn">
                      {editingUser ? "Зберегти Зміни" : "Створити Користувача"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card className="bg-military-green border-2 border-military-olive">
              <CardHeader className="border-b border-military-olive">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-military-gold">Усі Користувачі</CardTitle>
                  <Button
                    onClick={() => {
                      setCreatingUser(true);
                      setEditingUser(null);
                      setUserForm({ full_name: "", email: "", password: "", rank: "", role: "user" });
                      setRankCategory("");
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-military-accent hover:bg-military-gold text-military-dark font-bold"
                    data-testid="create-user-btn"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Створити Користувача
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {users.map((userItem) => (
                    <div
                      key={userItem.id}
                      className="flex items-start justify-between p-4 bg-military-dark rounded-lg border border-military-olive hover:border-military-accent transition-colors"
                      data-testid={`user-item-${userItem.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <User className="w-5 h-5 text-military-gold" />
                          <h3 className="text-military-gold font-bold text-lg">{userItem.full_name}</h3>
                          {userItem.role === "admin" && (
                            <span className="px-2 py-1 bg-military-gold text-military-dark text-xs font-bold rounded">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-military-light text-sm mb-1">
                          <span className="text-military-accent">Email:</span> {userItem.email}
                        </p>
                        <p className="text-military-accent text-xs">
                          Дата регистрации: {new Date(userItem.created_at).toLocaleDateString("ru")}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleEditUser(userItem)}
                          variant="outline"
                          size="sm"
                          className="border-military-olive text-military-light hover:bg-military-olive hover:text-military-gold"
                          data-testid={`edit-user-btn-${userItem.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteUser(userItem.id)}
                          variant="destructive"
                          size="sm"
                          data-testid={`delete-user-btn-${userItem.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-8">
            <Card className="bg-military-green border-2 border-military-olive">
              <CardHeader className="border-b border-military-olive">
                <CardTitle className="text-military-gold flex items-center">
                  {editingGroup ? (
                    <>
                      <Edit className="w-6 h-6 mr-2" />
                      Редактировать Группу
                    </>
                  ) : (
                    <>
                      <Plus className="w-6 h-6 mr-2" />
                      Создать Группу (Подразделение)
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleGroupSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="group_name" className="text-military-light text-lg">Название Группы</Label>
                    <Input
                      id="group_name"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                      className="bg-military-dark border-military-olive text-military-light"
                      required
                      placeholder="Например: 1-й Взвод, Инженерная Рота"
                      data-testid="group-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="group_description" className="text-military-light">Описание</Label>
                    <Textarea
                      id="group_description"
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      className="bg-military-dark border-military-olive text-military-light min-h-[100px]"
                      placeholder="Дополнительная информация о подразделении"
                      data-testid="group-description-input"
                    />
                  </div>

                  {editingGroup && (
                    <div className="space-y-3 p-4 bg-military-dark rounded-lg border border-military-olive">
                      <Label className="text-military-light text-lg">Участники Группы</Label>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {users.map((userItem) => (
                          <div
                            key={userItem.id}
                            className="flex items-center space-x-3 p-3 bg-military-green rounded hover:bg-military-olive transition-colors cursor-pointer"
                            onClick={() => toggleGroupMember(userItem.id)}
                          >
                            <input
                              type="checkbox"
                              checked={groupForm.member_ids.includes(userItem.id)}
                              onChange={() => toggleGroupMember(userItem.id)}
                              className="w-5 h-5 cursor-pointer"
                              data-testid={`group-member-${userItem.id}`}
                            />
                            <div className="flex-1">
                              <p className="text-military-light font-semibold">{userItem.full_name}</p>
                              <p className="text-military-accent text-sm">{userItem.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-military-accent text-sm">
                        Выбрано: {groupForm.member_ids.length} участников
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      className="bg-military-olive hover:bg-military-accent text-military-dark font-bold flex-1"
                      data-testid="save-group-btn"
                    >
                      {editingGroup ? "Сохранить Изменения" : "Создать Группу"}
                    </Button>
                    {editingGroup && (
                      <Button
                        type="button"
                        onClick={() => {
                          setEditingGroup(null);
                          setGroupForm({ name: "", description: "", member_ids: [] });
                        }}
                        variant="outline"
                        className="border-military-olive text-military-light"
                      >
                        Отменить
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-military-green border-2 border-military-olive">
              <CardHeader className="border-b border-military-olive">
                <CardTitle className="text-military-gold">Все Группы</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map((groupItem) => (
                    <Card
                      key={groupItem.id}
                      className="bg-military-dark border border-military-olive hover:border-military-accent transition-all"
                      data-testid={`group-item-${groupItem.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-military-gold text-xl mb-2">
                              {groupItem.name}
                            </CardTitle>
                            {groupItem.description && (
                              <p className="text-military-light text-sm">{groupItem.description}</p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-military-olive">
                          <div className="flex items-center space-x-2 text-military-accent">
                            <User className="w-4 h-4" />
                            <span className="text-sm">
                              Участников: {groupItem.member_ids?.length || 0}
                            </span>
                          </div>
                          <span className="text-military-accent text-xs">
                            {new Date(groupItem.created_at).toLocaleDateString("ru")}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditGroup(groupItem)}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-military-olive text-military-light hover:bg-military-olive hover:text-military-gold"
                            data-testid={`edit-group-btn-${groupItem.id}`}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Редактировать
                          </Button>
                          <Button
                            onClick={() => handleDeleteGroup(groupItem.id)}
                            variant="destructive"
                            size="sm"
                            data-testid={`delete-group-btn-${groupItem.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {groups.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-military-accent">
                      <p>Групп пока нет. Создайте первую группу выше.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-8">
            <Card className="bg-military-green border-2 border-military-olive">
              <CardHeader className="border-b border-military-olive">
                <CardTitle className="text-military-gold">Настройки Части</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSettingsUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="unit_name" className="text-military-light text-lg">Название Части</Label>
                    <Input
                      id="unit_name"
                      value={settings.unit_name}
                      onChange={(e) => setSettings({ ...settings, unit_name: e.target.value })}
                      className="bg-military-dark border-military-olive text-military-light text-lg"
                      required
                      data-testid="settings-unit-name-input"
                      placeholder="Военная Часть №12345"
                    />
                    <p className="text-military-accent text-sm">Это название будет отображаться в шапке сайта</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_subtitle" className="text-military-light text-lg">Подзаголовок</Label>
                    <Input
                      id="unit_subtitle"
                      value={settings.unit_subtitle}
                      onChange={(e) => setSettings({ ...settings, unit_subtitle: e.target.value })}
                      className="bg-military-dark border-military-olive text-military-light"
                      required
                      data-testid="settings-unit-subtitle-input"
                      placeholder="Информационная Система"
                    />
                    <p className="text-military-accent text-sm">Подзаголовок под названием части</p>
                  </div>

                  <div className="pt-4 border-t border-military-olive">
                    <h3 className="text-military-gold font-semibold mb-4">Настройки Страницы Новостей</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="news_title" className="text-military-light">Заголовок Страницы Новостей</Label>
                        <Input
                          id="news_title"
                          value={settings.news_title}
                          onChange={(e) => setSettings({ ...settings, news_title: e.target.value })}
                          className="bg-military-dark border-military-olive text-military-light"
                          required
                          data-testid="settings-news-title-input"
                          placeholder="Новости Части"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="news_subtitle" className="text-military-light">Подзаголовок Страницы Новостей</Label>
                        <Input
                          id="news_subtitle"
                          value={settings.news_subtitle}
                          onChange={(e) => setSettings({ ...settings, news_subtitle: e.target.value })}
                          className="bg-military-dark border-military-olive text-military-light"
                          required
                          data-testid="settings-news-subtitle-input"
                          placeholder="Актуальная информация и объявления"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-military-olive">
                    <Label htmlFor="unit_icon" className="text-military-light text-lg">URL Иконки</Label>
                    <Input
                      id="unit_icon"
                      value={settings.unit_icon}
                      onChange={(e) => setSettings({ ...settings, unit_icon: e.target.value })}
                      className="bg-military-dark border-military-olive text-military-light"
                      required
                      data-testid="settings-unit-icon-input"
                      placeholder="https://example.com/icon.png"
                    />
                    <p className="text-military-accent text-sm">Рекомендуемый размер: 64x64px или 128x128px (квадратная)</p>
                  </div>

                  {settings.unit_icon && (
                    <div className="space-y-2">
                      <Label className="text-military-light">Предпросмотр Иконки</Label>
                      <div className="p-4 bg-military-dark rounded-lg border border-military-olive flex items-center justify-center">
                        <img 
                          src={settings.unit_icon} 
                          alt="Unit icon preview" 
                          className="w-16 h-16 object-contain"
                          onError={(e) => {
                            e.target.src = "https://cdn-icons-png.flaticon.com/512/2913/2913133.png";
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="bg-military-olive hover:bg-military-accent text-military-dark font-bold w-full py-6 text-lg"
                    data-testid="save-settings-btn"
                  >
                    Сохранить Настройки
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;