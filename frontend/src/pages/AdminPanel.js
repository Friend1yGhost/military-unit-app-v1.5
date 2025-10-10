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
import { Trash2, Plus, Calendar, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminPanel = () => {
  const [news, setNews] = useState([]);
  const [duties, setDuties] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({ unit_name: "", unit_icon: "" });
  const [newsForm, setNewsForm] = useState({ title: "", content: "", image_url: "" });
  const [dutyForm, setDutyForm] = useState({
    user_id: "",
    duty_type: "",
    position: "",
    shift_start: "",
    shift_end: "",
    rotation_cycle: "weekly",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const [newsRes, dutiesRes, usersRes, settingsRes] = await Promise.all([
        axios.get(`${API}/news`),
        axios.get(`${API}/duties`, config),
        axios.get(`${API}/users`, config),
        axios.get(`${API}/settings`)
      ]);

      setNews(newsRes.data);
      setDuties(dutiesRes.data);
      setUsers(usersRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      toast.error("Ошибка загрузки данных");
    }
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.post(`${API}/news`, newsForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Новость опубликована!");
      setNewsForm({ title: "", content: "", image_url: "" });
      fetchData();
    } catch (error) {
      toast.error("Ошибка публикации новости");
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
      await axios.post(`${API}/duties`, dutyForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Наряд создан!");
      setDutyForm({
        user_id: "",
        duty_type: "",
        position: "",
        shift_start: "",
        shift_end: "",
        rotation_cycle: "weekly",
        notes: ""
      });
      fetchData();
    } catch (error) {
      toast.error("Ошибка создания наряда");
    }
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
      // Refresh to update navbar
      window.location.reload();
    } catch (error) {
      toast.error("Ошибка обновления настроек");
    }
  };

  return (
    <div className="min-h-screen bg-military-dark py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-military-gold mb-8 text-center">
          Панель Администратора
        </h1>

        <Tabs defaultValue="news" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-military-green mb-8">
            <TabsTrigger value="news" className="data-[state=active]:bg-military-olive data-[state=active]:text-military-gold" data-testid="news-tab">
              Новости
            </TabsTrigger>
            <TabsTrigger value="duties" className="data-[state=active]:bg-military-olive data-[state=active]:text-military-gold" data-testid="duties-tab">
              Наряды
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-military-olive data-[state=active]:text-military-gold" data-testid="settings-tab">
              Настройки
            </TabsTrigger>
          </TabsList>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-8">
            <Card className="bg-military-green border-2 border-military-olive">
              <CardHeader className="border-b border-military-olive">
                <CardTitle className="text-military-gold flex items-center">
                  <Plus className="w-6 h-6 mr-2" />
                  Опубликовать Новость
                </CardTitle>
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
                    />
                  </div>

                  <Button type="submit" className="bg-military-olive hover:bg-military-accent text-military-dark font-bold" data-testid="publish-news-btn">
                    Опубликовать
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
                      <Button
                        onClick={() => handleDeleteNews(item.id)}
                        variant="destructive"
                        size="sm"
                        className="ml-4"
                        data-testid={`delete-news-btn-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
                <CardTitle className="text-military-gold flex items-center">
                  <Plus className="w-6 h-6 mr-2" />
                  Создать Наряд
                </CardTitle>
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
                      <Button
                        onClick={() => handleDeleteDuty(duty.id)}
                        variant="destructive"
                        size="sm"
                        className="ml-4"
                        data-testid={`delete-duty-btn-${duty.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;