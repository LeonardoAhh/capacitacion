
import {
    Award, Star, Zap, TrendingUp, Shield,
    BookOpen, Target, Crown, Sun, Moon,
    Palette, User, CheckCircle, Flame, Trophy,
    Medal, GraduationCap, Lightbulb, Rocket, Diamond, Calendar,
    Eye, Library, Sparkles, Gem, Heart, Infinity
} from 'lucide-react';

// === RANKS SYSTEM (12 Niveles — Automotive Plastic Injection Theme) ===
export const RANKS = [
    { minLevel: 1, title: 'Nuevo Ingreso', color: '#94a3b8', icon: '🌱' },
    { minLevel: 3, title: 'Aprendiz', color: '#cd7f32', icon: '🥉' },
    { minLevel: 5, title: 'Aprendiz en Desarrollo', color: '#fb923c', icon: '📘' },
    { minLevel: 8, title: 'Colaborador Activo', color: '#3b82f6', icon: '⚡' },
    { minLevel: 12, title: 'Colaborador Destacado', color: '#14b8a6', icon: '🌟' },
    { minLevel: 15, title: 'Especialista Técnico', color: '#22c55e', icon: '🔧' },
    { minLevel: 20, title: 'Especialista Senior', color: '#84cc16', icon: '🎯' },
    { minLevel: 25, title: 'Master de Calidad', color: '#a855f7', icon: '🏅' },
    { minLevel: 35, title: 'Master Avanzado', color: '#d946ef', icon: '💎' },
    { minLevel: 40, title: 'Mentor Excepcional', color: '#ec4899', icon: '🧠' },
    { minLevel: 50, title: 'Embajador de Excelencia', color: '#06b6d4', icon: '🏛️' },
    { minLevel: 60, title: 'Leyenda Viñoplastic', color: '#eab308', icon: '👑' },
];

// XP Constants
export const XP_PER_COURSE = 100;
export const XP_PER_LOGIN = 10;
export const XP_PER_BADGE = 50;

// === BADGES COLLECTION (30 Premium Badges) ===
export const BADGES = [
    // ── 1-5: Course Progress ──────────────────────────────────
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

    // ── 6-10: Engagement / Time ───────────────────────────────
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

    // ── 11-13: Customization & Identity ───────────────────────

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

    // ── 14-20: Levels & Special ───────────────────────────────
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
        icon: <Diamond />,
        color: 'from-cyan-300 to-blue-500',
        condition: (stats) => stats.hasQualityCourse
    },

    // ── 21-30: NEW BADGES ─────────────────────────────────────
    {
        id: 'marathoner',
        title: 'Maratonista',
        description: 'Completaste 30 cursos. ¡Resistencia total!',
        icon: <TrendingUp />,
        color: 'from-rose-400 to-pink-600',
        condition: (stats) => stats.completed >= 30
    },
    {
        id: 'encyclopedia',
        title: 'Enciclopedia',
        description: 'Completaste 50 cursos. Sabiduría absoluta.',
        icon: <Library />,
        color: 'from-violet-500 to-purple-700',
        condition: (stats) => stats.completed >= 50
    },
    {
        id: 'consistent',
        title: 'Constante',
        description: '14 días seguidos de capacitación.',
        icon: <Heart />,
        color: 'from-red-400 to-rose-600',
        condition: (stats) => stats.streak >= 14
    },
    {
        id: 'machine',
        title: 'Máquina',
        description: '30 días seguidos. ¡Imparable!',
        icon: <Infinity />,
        color: 'from-gray-600 to-gray-900',
        condition: (stats) => stats.streak >= 30
    },
    {
        id: 'explorer',
        title: 'Explorador',
        description: 'Viste todos los cursos asignados.',
        icon: <Eye />,
        color: 'from-sky-400 to-blue-600',
        condition: (stats) => stats.allViewed
    },
    {
        id: 'collector',
        title: 'Coleccionista',
        description: 'Desbloqueaste 10 medallas.',
        icon: <Medal />,
        color: 'from-amber-400 to-yellow-600',
        condition: (stats) => stats.earnedBadges >= 10
    },
    {
        id: 'completist',
        title: 'Completista',
        description: 'Desbloqueaste 20 medallas.',
        icon: <Gem />,
        color: 'from-fuchsia-400 to-purple-600',
        condition: (stats) => stats.earnedBadges >= 20
    },
    {
        id: 'elite',
        title: 'Élite',
        description: 'Alcanzaste el Nivel 30.',
        icon: <Sparkles />,
        color: 'from-indigo-500 to-blue-700',
        condition: (stats) => stats.level >= 30
    },
    {
        id: 'titan',
        title: 'Titán',
        description: 'Alcanzaste el Nivel 50. Pocos llegan aquí.',
        icon: <Crown />,
        color: 'from-yellow-500 to-amber-700',
        condition: (stats) => stats.level >= 50
    },
    {
        id: 'vinoplastic_100',
        title: 'Viñoplastic 100%',
        description: 'Completaste todos tus cursos asignados.',
        icon: <Trophy />,
        color: 'from-emerald-400 to-teal-600',
        condition: (stats) => stats.allCompleted && stats.completed > 0
    },
];

// === CERTIFICATES SYSTEM ===
export const CERTIFICATE_TIERS = {
    bronze: { label: 'Bronce', borderColor: '#cd7f32', bgGradient: 'linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)', accentColor: '#cd7f32' },
    silver: { label: 'Plata', borderColor: '#c0c0c0', bgGradient: 'linear-gradient(135deg, #fafafa 0%, #e0e0e0 100%)', accentColor: '#9e9e9e' },
    gold: { label: 'Oro', borderColor: '#eab308', bgGradient: 'linear-gradient(135deg, #fffef5 0%, #fef3c7 100%)', accentColor: '#ca8a04' },
    platinum: { label: 'Platino', borderColor: '#a78bfa', bgGradient: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)', accentColor: '#7c3aed' },
    diamond: { label: 'Diamante', borderColor: '#22d3ee', bgGradient: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', accentColor: '#0891b2' },
    legendary: { label: 'Legendario', borderColor: '#f59e0b', bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', accentColor: '#d97706' },
};

export const CERTIFICATES = [
    {
        id: 'cert_first_steps',
        title: 'Certificado de Inducción',
        subtitle: 'Primeros pasos completados',
        description: 'Ha completado exitosamente sus primeros 3 cursos de capacitación.',
        tier: 'bronze',
        condition: (stats) => stats.completed >= 3,
    },
    {
        id: 'cert_dedicated_learner',
        title: 'Aprendiz Dedicado',
        subtitle: 'Compromiso demostrado',
        description: 'Ha completado 10 cursos, demostrando compromiso con su desarrollo profesional.',
        tier: 'silver',
        condition: (stats) => stats.completed >= 10,
    },
    {
        id: 'cert_expert',
        title: 'Experto en Capacitación',
        subtitle: 'Dominio técnico',
        description: 'Ha completado 20 cursos y alcanzado un nivel de experticia destacable.',
        tier: 'gold',
        condition: (stats) => stats.completed >= 20,
    },
    {
        id: 'cert_badge_master',
        title: 'Maestro de Logros',
        subtitle: 'Coleccionista de medallas',
        description: 'Ha desbloqueado 15 medallas, demostrando excelencia en múltiples áreas.',
        tier: 'platinum',
        condition: (stats) => stats.earnedBadges >= 15,
    },
    {
        id: 'cert_elite_level',
        title: 'Certificado Élite',
        subtitle: 'Nivel de excelencia',
        description: 'Ha alcanzado el Nivel 25, posicionándose entre los colaboradores más destacados.',
        tier: 'diamond',
        condition: (stats) => stats.level >= 25,
    },
    {
        id: 'cert_legendary',
        title: 'Leyenda de Viñoplastic',
        subtitle: 'Logro supremo',
        description: 'Ha completado todos sus cursos y desbloqueado 25 medallas. Un logro extraordinario.',
        tier: 'legendary',
        condition: (stats) => stats.allCompleted && stats.completed > 0 && stats.earnedBadges >= 25,
    },
];

// Helper to calculate Level from XP
export const calculateLevel = (xp) => {
    // Linear: Level = 1 + (XP / 200)
    return Math.floor(1 + (xp / 200));
};

export const getRankCurrent = (level) => {
    // Find the highest rank that meets the minimum level criteria
    return RANKS.slice().reverse().find(r => level >= r.minLevel) || RANKS[0];
};

export const getNextRank = (level) => {
    return RANKS.find(r => r.minLevel > level) || null;
};
