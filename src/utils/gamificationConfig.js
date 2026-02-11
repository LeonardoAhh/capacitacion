
import {
    Award, Star, Zap, TrendingUp, Shield,
    BookOpen, Target, Crown, Sun, Moon,
    Palette, User, CheckCircle, Flame, Trophy,
    Medal, GraduationCap, Lightbulb, Rocket, Diamond, Calendar
} from 'lucide-react';

// === RANKS SYSTEM (Automotive Plastic Injection Theme) ===
export const RANKS = [
    { minLevel: 1, title: 'Nuevo Ingreso', color: '#94a3b8' },         // Slate
    { minLevel: 5, title: 'Aprendiz en Desarrollo', color: '#fb923c' },// Orange
    { minLevel: 10, title: 'Colaborador Activo', color: '#3b82f6' },   // Blue
    { minLevel: 15, title: 'Especialista Técnico', color: '#22c55e' }, // Green
    { minLevel: 25, title: 'Master de Calidad', color: '#a855f7' },    // Purple
    { minLevel: 40, title: 'Mentor Excepcional', color: '#ec4899' },   // Pink
    { minLevel: 60, title: 'Embajador de Excelencia', color: '#06b6d4' } // Cyan
];

// XP Constants
export const XP_PER_COURSE = 100;
export const XP_PER_LOGIN = 10;
export const XP_PER_BADGE = 50;

// === BADGES COLLECTION (20 Premium Badges) ===
export const BADGES = [
    // 1-5: Course Progress
    {
        id: 'first_step',
        title: 'Primer Paso',
        description: 'Completaste tu primer curso.',
        icon: <Award />,
        color: 'from-blue-400 to-blue-600',
        condition: (stats) => stats.completed >= 1
    },
    {
        id: 'student',
        title: 'Estudioso',
        description: 'Completaste 5 cursos.',
        icon: <BookOpen />,
        color: 'from-indigo-400 to-indigo-600',
        condition: (stats) => stats.completed >= 5
    },
    {
        id: 'scholar',
        title: 'Erudito',
        description: 'Completaste 10 cursos.',
        icon: <GraduationCap />,
        color: 'from-violet-400 to-violet-600',
        condition: (stats) => stats.completed >= 10
    },
    {
        id: 'genius',
        title: 'Genio',
        description: 'Completaste 20 cursos.',
        icon: <Lightbulb />,
        color: 'from-amber-400 to-amber-600',
        condition: (stats) => stats.completed >= 20
    },
    {
        id: 'perfectionist',
        title: 'Perfeccionista',
        description: 'Obtuviste 100% en una evaluación.',
        icon: <Target />,
        color: 'from-red-400 to-red-600',
        condition: (stats) => stats.hasPerfectScore
    },

    // 6-10: Engagement / Time
    {
        id: 'on_fire',
        title: '¡Encendido!',
        description: 'Entraste a la plataforma 3 días seguidos.',
        icon: <Flame />,
        color: 'from-orange-400 to-red-500',
        condition: (stats) => stats.streak >= 3
    },
    {
        id: 'unstoppable',
        title: 'Imparable',
        description: 'Racha de 7 días seguidos.',
        icon: <Zap />,
        color: 'from-yellow-400 to-orange-500',
        condition: (stats) => stats.streak >= 7
    },
    {
        id: 'early_bird',
        title: 'Tempranero',
        description: 'Estudiando antes de las 8:00 AM.',
        icon: <Sun />,
        color: 'from-yellow-300 to-yellow-500',
        condition: (stats) => stats.hasEarlyLogin
    },
    {
        id: 'night_owl',
        title: 'Nocturno',
        description: 'Estudiando después de las 8:00 PM.',
        icon: <Moon />,
        color: 'from-indigo-800 to-purple-900',
        condition: (stats) => stats.hasLateLogin
    },
    {
        id: 'weekend_warrior',
        title: 'Guerrero de Finde',
        description: 'Estudiando en Sábado o Domingo.',
        icon: <Calendar />,
        color: 'from-green-400 to-teal-500',
        condition: (stats) => stats.hasWeekendLogin
    },

    // 11-15: Customization & Identity
    {
        id: 'stylist',
        title: 'Estilista',
        description: 'Personalizaste tu tema.',
        icon: <Palette />,
        color: 'from-pink-400 to-rose-500',
        condition: (stats) => stats.hasCustomTheme
    },
    {
        id: 'identity',
        title: 'Identidad',
        description: 'Cambiaste tu avatar.',
        icon: <User />,
        color: 'from-cyan-400 to-blue-500',
        condition: (stats) => stats.hasCustomAvatar
    },
    {
        id: 'personality',
        title: 'Personalidad',
        description: 'Configuraste tu apodo.',
        icon: <CheckCircle />,
        color: 'from-emerald-400 to-green-600',
        condition: (stats) => stats.hasNickname
    },

    // 16-20: Levels & Special
    {
        id: 'rising_star',
        title: 'Estrella Naciente',
        description: 'Alcanzaste el Nivel 5.',
        icon: <Star />,
        color: 'from-yellow-300 to-yellow-600',
        condition: (stats) => stats.level >= 5
    },
    {
        id: 'veteran',
        title: 'Veterano',
        description: 'Alcanzaste el Nivel 10.',
        icon: <Shield />,
        color: 'from-slate-400 to-slate-600',
        condition: (stats) => stats.level >= 10
    },
    {
        id: 'legend',
        title: 'Leyenda',
        description: 'Alcanzaste el Nivel 20.',
        icon: <Crown />,
        color: 'from-purple-500 to-fuchsia-600',
        condition: (stats) => stats.level >= 20
    },
    {
        id: 'rocket',
        title: 'Despegue',
        description: 'Iniciaste sesión por primera vez.',
        icon: <Rocket />,
        color: 'from-red-500 to-orange-600',
        condition: (stats) => stats.loginCount >= 1
    },
    {
        id: 'dedicated',
        title: 'Dedicado',
        description: 'Lograste 50 inicios de sesión.',
        icon: <Trophy />,
        color: 'from-amber-300 to-amber-600',
        condition: (stats) => stats.loginCount >= 50
    },
    {
        id: 'safety_first',
        title: 'Seguridad Primero',
        description: 'Completaste un curso de Seguridad.',
        icon: <Shield />,
        color: 'from-green-500 to-emerald-700',
        condition: (stats) => stats.hasSafetyCourse
    },
    {
        id: 'quality_master',
        title: 'Maestro de Calidad',
        description: 'Completaste un curso de Calidad.',
        icon: <Diamond />, // Changed to Diamond for 'Premium' look
        color: 'from-cyan-300 to-blue-500',
        condition: (stats) => stats.hasQualityCourse
    }
];

// Helper to calculate Level from XP
export const calculateLevel = (xp) => {
    // Basic formula: Level = sqrt(XP / 100)
    // XP 100 = Lvl 1
    // XP 400 = Lvl 2
    // XP 900 = Lvl 3
    // Linear is easier for corporate: Level = 1 + (XP / 200)
    return Math.floor(1 + (xp / 200));
};

export const getRankCurrent = (level) => {
    // Find the highest rank that meets the minimum level criteria
    return RANKS.slice().reverse().find(r => level >= r.minLevel) || RANKS[0];
};

export const getNextRank = (level) => {
    return RANKS.find(r => r.minLevel > level) || null;
};
