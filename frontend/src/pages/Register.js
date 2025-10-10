import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield } from "lucide-react";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/auth/register`, {
        email,
        password,
        full_name: fullName
      });

      toast.success("Регистрация успешна! Теперь войдите в систему.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-military-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-military-green rounded-full">
            <Shield className="w-16 h-16 text-military-gold" />
          </div>
        </div>

        <Card className="bg-military-green border-2 border-military-olive shadow-2xl">
          <CardHeader className="space-y-1 border-b border-military-olive pb-6">
            <CardTitle className="text-3xl font-bold text-military-gold text-center">
              Регистрация
            </CardTitle>
            <CardDescription className="text-military-accent text-center">
              Создайте новый аккаунт
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-military-light">Полное Имя</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-military-dark border-military-olive text-military-light focus:border-military-accent"
                  required
                  data-testid="register-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-military-light">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-military-dark border-military-olive text-military-light focus:border-military-accent"
                  required
                  data-testid="register-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-military-light">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-military-dark border-military-olive text-military-light focus:border-military-accent"
                  required
                  data-testid="register-password-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-military-olive hover:bg-military-accent text-military-dark font-bold py-6 text-lg"
                disabled={loading}
                data-testid="register-submit-btn"
              >
                {loading ? "Регистрация..." : "Зарегистрироваться"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-military-accent text-sm">
                Уже есть аккаунт?{" "}
                <Link to="/login" className="text-military-gold hover:text-military-light font-semibold" data-testid="login-link">
                  Войти
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;