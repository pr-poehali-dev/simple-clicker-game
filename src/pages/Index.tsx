import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface GameState {
  points: number;
  pointsPerClick: number;
  totalClicks: number;
  multiplier: number;
  achievements: string[];
  upgrades: {
    [key: string]: number;
  };
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  effect: number;
  icon: string;
  costMultiplier: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  unlocked: boolean;
  icon: string;
}

const Index = () => {
  const [gameState, setGameState] = useState<GameState>({
    points: 0,
    pointsPerClick: 1,
    totalClicks: 0,
    multiplier: 1,
    achievements: [],
    upgrades: {}
  });

  const [clickAnimation, setClickAnimation] = useState(false);
  const [floatingPoints, setFloatingPoints] = useState<Array<{id: number, points: number, x: number, y: number}>>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Функция для вычисления стоимости улучшения
  const getUpgradeCost = (upgrade: Upgrade, level: number): number => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
  };

  // Звуковые эффекты
  const playClickSound = () => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playPurchaseSound = () => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const upgrades: Upgrade[] = [
    {
      id: 'click_power',
      name: 'Усиленный клик',
      description: '+1 очко за клик',
      baseCost: 25,
      effect: 1,
      icon: 'MousePointer',
      costMultiplier: 1.5
    },
    {
      id: 'multiplier',
      name: 'Множитель x1.5',
      description: 'Увеличивает все очки в 1.2 раза',
      baseCost: 200,
      effect: 1.2,
      icon: 'Zap',
      costMultiplier: 2.2
    },
    {
      id: 'auto_clicker',
      name: 'Автокликер',
      description: '+1 очко в секунду',
      baseCost: 150,
      effect: 1,
      icon: 'RotateCcw',
      costMultiplier: 1.8
    },
    {
      id: 'mega_boost',
      name: 'Мега усиление',
      description: '+3 очка за клик',
      baseCost: 500,
      effect: 3,
      icon: 'Rocket',
      costMultiplier: 2.0
    }
  ];

  const achievements: Achievement[] = [
    {
      id: 'first_click',
      name: 'Первый клик',
      description: 'Сделайте первый клик',
      requirement: 1,
      unlocked: false,
      icon: 'Target'
    },
    {
      id: 'hundred_clicks',
      name: 'Сотня кликов',
      description: 'Сделайте 100 кликов',
      requirement: 100,
      unlocked: false,
      icon: 'Award'
    },
    {
      id: 'thousand_points',
      name: 'Тысяча очков',
      description: 'Наберите 1000 очков',
      requirement: 1000,
      unlocked: false,
      icon: 'Star'
    },
    {
      id: 'ten_thousand_points',
      name: 'Магистр кликов',
      description: 'Наберите 10000 очков',
      requirement: 10000,
      unlocked: false,
      icon: 'Crown'
    }
  ];

  const handleClick = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const pointsEarned = gameState.pointsPerClick * gameState.multiplier;
    
    setGameState(prev => ({
      ...prev,
      points: prev.points + pointsEarned,
      totalClicks: prev.totalClicks + 1
    }));

    // Анимация клика и звук
    setClickAnimation(true);
    playClickSound();
    setTimeout(() => setClickAnimation(false), 150);

    // Плавающие очки
    const newFloatingPoint = {
      id: Date.now(),
      points: pointsEarned,
      x,
      y
    };
    setFloatingPoints(prev => [...prev, newFloatingPoint]);
    
    // Удаляем плавающие очки через 1 секунду
    setTimeout(() => {
      setFloatingPoints(prev => prev.filter(fp => fp.id !== newFloatingPoint.id));
    }, 1000);
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    const level = gameState.upgrades[upgrade.id] || 0;
    const cost = getUpgradeCost(upgrade, level);
    
    if (gameState.points >= cost) {
      playPurchaseSound();
      setGameState(prev => {
        const newState = {
          ...prev,
          points: prev.points - cost,
          upgrades: {
            ...prev.upgrades,
            [upgrade.id]: level + 1
          }
        };

        // Применяем эффект улучшения
        if (upgrade.id === 'click_power' || upgrade.id === 'mega_boost') {
          newState.pointsPerClick = prev.pointsPerClick + upgrade.effect;
        } else if (upgrade.id === 'multiplier') {
          newState.multiplier = prev.multiplier * upgrade.effect;
        }

        return newState;
      });
    }
  };

  // Проверка достижений
  useEffect(() => {
    achievements.forEach(achievement => {
      if (!gameState.achievements.includes(achievement.id)) {
        let condition = false;
        
        if (achievement.id === 'first_click' && gameState.totalClicks >= 1) condition = true;
        if (achievement.id === 'hundred_clicks' && gameState.totalClicks >= 100) condition = true;
        if (achievement.id === 'thousand_points' && gameState.points >= 1000) condition = true;
        if (achievement.id === 'ten_thousand_points' && gameState.points >= 10000) condition = true;

        if (condition) {
          setGameState(prev => ({
            ...prev,
            achievements: [...prev.achievements, achievement.id]
          }));
        }
      }
    });
  }, [gameState.points, gameState.totalClicks]);

  // Автокликер
  useEffect(() => {
    const autoClickerLevel = gameState.upgrades['auto_clicker'] || 0;
    if (autoClickerLevel > 0) {
      const interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          points: prev.points + (autoClickerLevel * 1 * prev.multiplier)
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameState.upgrades['auto_clicker'], gameState.multiplier]);

  return (
    <div className="min-h-screen mountain-bg relative p-4">
      <div className="absolute inset-0 mountain-overlay"></div>
      <div className="relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Кликер Игра</h1>
          <p className="text-gray-600">Кликайте, улучшайтесь, побеждайте!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Главная игровая зона */}
          <div className="lg:col-span-2">
            <Card className="liquid-glass-primary rounded-3xl border-0 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  <Icon name="Coins" className="inline mr-2" />
                  {gameState.points.toLocaleString()} очков
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {gameState.pointsPerClick * gameState.multiplier} очков за клик
                </p>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <Button
                    onClick={handleClick}
                    className={`w-48 h-48 rounded-full text-2xl font-bold liquid-glass-primary liquid-glass-hover shadow-2xl transition-all duration-300 border-2 border-white/40 ${
                      clickAnimation ? 'scale-95 shadow-lg' : 'scale-100'
                    }`}
                  >
                    КЛИК!
                  </Button>
                  
                  {/* Плавающие очки */}
                  {floatingPoints.map(fp => (
                    <div
                      key={fp.id}
                      className="absolute pointer-events-none text-purple-600 font-bold text-xl animate-float-up"
                      style={{
                        left: fp.x,
                        top: fp.y,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      +{fp.points}
                    </div>
                  ))}
                </div>

                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Всего кликов: {gameState.totalClicks.toLocaleString()}</span>
                    <span>Множитель: x{gameState.multiplier}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Боковая панель с вкладками */}
          <div>
            <Tabs defaultValue="shop" className="w-full">
              <TabsList className="grid w-full grid-cols-3 liquid-glass rounded-2xl border-0">
                <TabsTrigger value="shop">
                  <Icon name="ShoppingCart" size={16} className="mr-1" />
                  Магазин
                </TabsTrigger>
                <TabsTrigger value="achievements">
                  <Icon name="Trophy" size={16} className="mr-1" />
                  Награды
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Icon name="Settings" size={16} className="mr-1" />
                  Настройки
                </TabsTrigger>
              </TabsList>

              {/* Магазин улучшений */}
              <TabsContent value="shop" className="space-y-4">
                <Card className="backdrop-blur-md bg-white/70 border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Улучшения</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upgrades.map(upgrade => {
                      const level = gameState.upgrades[upgrade.id] || 0;
                      const cost = getUpgradeCost(upgrade, level);
                      const canAfford = gameState.points >= cost;
                      
                      return (
                        <div key={upgrade.id} className="flex items-center justify-between p-4 liquid-glass liquid-glass-hover rounded-2xl border-0 transition-all duration-300">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon name={upgrade.icon as any} size={20} />
                              <span className="font-medium">{upgrade.name}</span>
                              {level > 0 && <Badge variant="secondary" className="bg-purple-100/60">{level}</Badge>}
                            </div>
                            <p className="text-sm text-gray-600">{upgrade.description}</p>
                            <p className="text-sm font-medium text-purple-600">{cost.toLocaleString()} очков</p>
                          </div>
                          <Button
                            onClick={() => buyUpgrade(upgrade)}
                            disabled={!canAfford}
                            size="sm"
                            className="ml-2 liquid-glass liquid-glass-hover rounded-xl px-4 py-2 text-white font-medium transition-all duration-300"
                          >
                            Купить
                          </Button>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Достижения */}
              <TabsContent value="achievements" className="space-y-4">
                <Card className="backdrop-blur-md bg-white/70 border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Достижения</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {achievements.map(achievement => {
                      const unlocked = gameState.achievements.includes(achievement.id);
                      
                      return (
                        <div
                          key={achievement.id}
                          className={`p-4 liquid-glass liquid-glass-hover rounded-2xl border-0 transition-all duration-300 ${
                            unlocked ? 'bg-gradient-to-r from-green-200/20 to-green-300/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon
                              name={achievement.icon as any}
                              size={20}
                              className={unlocked ? 'text-green-600' : 'text-gray-400'}
                            />
                            <span className={`font-medium ${unlocked ? 'text-green-700' : 'text-gray-600'}`}>
                              {achievement.name}
                            </span>
                            {unlocked && <Badge className="bg-green-100 text-green-700">Получено</Badge>}
                          </div>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Таблица лидеров (заглушка) */}
                <Card className="backdrop-blur-md bg-white/70 border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Таблица лидеров</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 liquid-glass liquid-glass-hover rounded-2xl border-0 bg-gradient-to-r from-yellow-200/20 to-yellow-300/20">
                        <span className="flex items-center gap-2">
                          <Icon name="Crown" size={16} className="text-yellow-600" />
                          <span className="font-medium">Вы</span>
                        </span>
                        <span className="font-bold">{gameState.points.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded backdrop-blur-sm bg-white/40 border-white/30">
                        <span>Игрок_2</span>
                        <span>8,543</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded backdrop-blur-sm bg-white/40 border-white/30">
                        <span>Игрок_3</span>
                        <span>7,221</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Настройки */}
              <TabsContent value="settings" className="space-y-4">
                <Card className="backdrop-blur-md bg-white/70 border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Настройки игры</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Звуковые эффекты</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`liquid-glass liquid-glass-hover rounded-xl px-4 py-2 font-medium transition-all duration-300 ${soundEnabled ? 'text-green-200 bg-gradient-to-r from-green-200/20 to-green-300/20' : 'text-red-200 bg-gradient-to-r from-red-200/20 to-red-300/20'}`}
                      >
                        {soundEnabled ? 'Вкл' : 'Выкл'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Анимации</span>
                      <Button variant="outline" size="sm" className="backdrop-blur-sm bg-green-100/60 text-green-700">Вкл</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Автосохранение</span>
                      <Button variant="outline" size="sm" className="backdrop-blur-sm bg-green-100/60 text-green-700">Вкл</Button>
                    </div>
                    <Button className="w-full" variant="destructive">
                      Сбросить прогресс
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Index;