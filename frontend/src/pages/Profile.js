import React, { useState, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Lock, Save } from "lucide-react";

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    rank: user?.rank || "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Пароли не совпадают");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    const updateData = {
      full_name: formData.full_name,
      email: formData.email
    };

    if (formData.password) {
      updateData.password = formData.password;
    }

    try {
      const response = await axios.put(`${API}/auth/profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data);
      toast.success("Профиль обновлен!");
      setFormData({ ...formData, password: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Ошибка обновления профиля");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-military-dark py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-4xl font-bold text-military-gold mb-8 text-center">
          Мой Профиль
        </h1>

        <Card className="bg-military-green border-2 border-military-olive">
          <CardHeader className="border-b border-military-olive">
            <CardTitle className="text-military-gold flex items-center">
              <User className="w-6 h-6 mr-2" />
              Редактировать Профиль
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-military-light flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Полное Имя
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="bg-military-dark border-military-olive text-military-light"
                  required
                  data-testid="profile-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-military-light flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-military-dark border-military-olive text-military-light"
                  required
                  data-testid="profile-email-input"
                />
              </div>

              <div className="pt-4 border-t border-military-olive">
                <h3 className="text-military-gold font-semibold mb-4 flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Изменить Пароль (необязательно)
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-military-light">Новый Пароль</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="bg-military-dark border-military-olive text-military-light"
                      data-testid="profile-password-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-military-light">Подтвердить Пароль</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="bg-military-dark border-military-olive text-military-light"
                      data-testid="profile-confirm-password-input"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-military-olive hover:bg-military-accent text-military-dark font-bold py-6 text-lg"
                disabled={loading}
                data-testid="save-profile-btn"
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? "Сохранение..." : "Сохранить Изменения"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-military-green border border-military-olive rounded-lg">
          <h3 className="text-military-accent text-sm font-semibold mb-2">Информация об аккаунте</h3>
          <div className="text-military-light text-sm space-y-1">
            <p><span className="text-military-accent">Роль:</span> {user?.role === "admin" ? "Администратор" : "Пользователь"}</p>
            <p><span className="text-military-accent">Дата регистрации:</span> {new Date(user?.created_at).toLocaleDateString("ru")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;