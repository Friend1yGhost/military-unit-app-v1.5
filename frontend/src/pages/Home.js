import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const Home = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ unit_name: "Военная Часть" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [newsRes, settingsRes] = await Promise.all([
        axios.get(`${API}/news`),
        axios.get(`${API}/settings`)
      ]);
      setNews(newsRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-military-dark">
      {/* Hero Section */}
      <div className="relative bg-military-green py-20 border-b-4 border-military-olive">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)'
          }}></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-military-gold mb-4 text-center">
            Новости Части
          </h1>
          <p className="text-xl text-military-light text-center max-w-2xl mx-auto">
            Актуальная информация и объявления военной части
          </p>
        </div>
      </div>

      {/* News Grid */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-military-light text-xl">Загрузка новостей...</div>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-military-accent text-xl">Новостей пока нет</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <Card 
                key={item.id} 
                className="bg-military-green border-2 border-military-olive hover:border-military-accent transition-all duration-300 hover:shadow-xl hover:shadow-military-olive/50 overflow-hidden group"
                data-testid={`news-card-${item.id}`}
              >
                {item.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader className="border-b border-military-olive">
                  <CardTitle className="text-military-gold text-2xl mb-2" data-testid={`news-title-${item.id}`}>
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center justify-between text-sm text-military-accent">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{item.author_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(item.created_at), "dd MMM yyyy", { locale: ru })}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-military-light leading-relaxed" data-testid={`news-content-${item.id}`}>
                    {item.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;