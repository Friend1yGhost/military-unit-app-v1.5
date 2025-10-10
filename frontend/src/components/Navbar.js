import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, LayoutDashboard, Calendar, Menu, X } from "lucide-react";
import axios from "axios";
import { API } from "../App";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [settings, setSettings] = useState({ 
    unit_name: "Военная Часть",
    unit_subtitle: "Информационная Система",
    unit_icon: "https://cdn-icons-png.flaticon.com/512/2913/2913133.png" 
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-military-green border-b-2 border-military-olive shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-military-dark rounded-lg group-hover:bg-military-olive transition-colors">
              <img 
                src={settings.unit_icon} 
                alt="Unit icon"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <Shield className="w-8 h-8 text-military-gold" style={{ display: 'none' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-military-light">{settings.unit_name}</h1>
              <p className="text-xs text-military-accent">Информационная Система</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-military-light text-sm hidden md:block">
                  {user.full_name}
                </span>
                
                <Link to="/my-duties">
                  <Button 
                    variant="ghost" 
                    className="text-military-light hover:bg-military-olive hover:text-military-gold"
                    data-testid="my-duties-nav-btn"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Мои Наряды
                  </Button>
                </Link>

                {user.role === "admin" && (
                  <Link to="/admin">
                    <Button 
                      variant="ghost" 
                      className="text-military-gold hover:bg-military-olive"
                      data-testid="admin-panel-nav-btn"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Админ Панель
                    </Button>
                  </Link>
                )}

                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="border-military-olive text-military-light hover:bg-military-dark hover:border-military-accent"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Выход
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button 
                    variant="outline"
                    className="border-military-olive text-military-light hover:bg-military-olive hover:text-military-gold"
                    data-testid="login-nav-btn"
                  >
                    Вход
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    className="bg-military-olive hover:bg-military-accent text-military-dark font-semibold"
                    data-testid="register-nav-btn"
                  >
                    Регистрация
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
