/**
 * @file icons.js
 * @description Punto único de verdad para todos los iconos de la plataforma.
 *
 * Importa siempre desde aquí:
 *   import { IconUser, IconLogOut } from '@/lib/icons';
 *
 * Cambiar librería de iconos = solo editar este archivo.
 * Librería: react-icons/ai (Ant Design Icons)
 */

import {
    // Navegación
    AiOutlineArrowLeft,
    AiOutlineArrowRight,
    AiOutlineLeft,
    AiOutlineRight,
    AiOutlineDown,
    AiOutlineUp,
    AiOutlineClose,
    AiOutlineMenu,
    AiOutlineHome,

    // Usuario / Auth
    AiOutlineUser,
    AiOutlineTeam,
    AiOutlineUserAdd,
    AiOutlineUserSwitch,
    AiOutlineEye,
    AiOutlineEyeInvisible,
    AiOutlineLogin,
    AiOutlineLogout,

    // Archivos / Contenido
    AiOutlineFile,
    AiOutlineFileText,
    AiOutlineFileDone,
    AiOutlineFolderOpen,
    AiOutlineBook,
    AiOutlineRead,

    // Edición / CRUD
    AiOutlineEdit,
    AiOutlineDelete,
    AiOutlineSave,
    AiOutlinePlus,
    AiOutlineMinus,
    AiOutlineSearch,
    AiOutlineFilter,
    AiOutlinePicture,
    AiOutlineVideoCameraAdd,
    AiOutlineUpload,
    AiOutlineCloudUpload,
    AiOutlineDownload,

    // Estado / Feedback
    AiOutlineCheckCircle,
    AiOutlineCheck,
    AiOutlineCloseCircle,
    AiOutlineWarning,
    AiOutlineExclamationCircle,
    AiOutlineInfoCircle,
    AiOutlineLoading,

    // Tiempo / Calendario
    AiOutlineClockCircle,
    AiOutlineCalendar,
    AiOutlineHistory,

    // Gamificación / Logros
    AiOutlineTrophy,
    AiOutlineStar,
    AiOutlineGift,

    // Layout / Diseño
    AiOutlineAppstore,
    AiOutlineLayout,
    AiOutlineDashboard,
    AiOutlineColumnWidth,
    AiOutlineBars,
    AiOutlineDrag,

    // Comunicación
    AiOutlineBell,
    AiOutlineMessage,
    AiOutlineMail,
    AiOutlineShareAlt,

    // Seguridad / Admin
    AiOutlineSafety,
    AiOutlineLock,
    AiOutlineKey,
    AiOutlineSetting,

    // Media
    AiOutlinePlayCircle,
    AiOutlinePauseCircle,
    AiOutlineCamera,
    AiOutlineSound,

    // Analytics
    AiOutlineBarChart,
    AiOutlineLineChart,
    AiOutlineRise,
    AiOutlineAim,

    // Misceláneos
    AiOutlineWifi,
    AiOutlineDisconnect,
    AiOutlineTool,
    AiOutlineBulb,
    AiOutlineSmile,
    AiOutlineEnvironment,
    AiOutlineThunderbolt,
    AiOutlineMonitor,
    AiOutlineFormatPainter,
    AiOutlineInbox,
    AiOutlineTags,
    AiOutlineIdcard,
    AiOutlineCrown,
    AiOutlineGlobal,
    AiOutlineCheckSquare,
    AiOutlineReload,
    AiOutlineFullscreen,
    AiOutlineFullscreenExit,
} from 'react-icons/ai';

// ─────────────────────────────────────────────
//  EXPORTACIONES CON NOMBRES SEMÁNTICOS
// ─────────────────────────────────────────────

// Navegación
export const IconArrowLeft = AiOutlineArrowLeft;
export const IconArrowRight = AiOutlineArrowRight;
export const IconChevronLeft = AiOutlineLeft;
export const IconChevronRight = AiOutlineRight;
export const IconChevronDown = AiOutlineDown;
export const IconChevronUp = AiOutlineUp;
export const IconX = AiOutlineClose;
export const IconMenu = AiOutlineMenu;
export const IconHome = AiOutlineHome;

// Usuario / Auth
export const IconUser = AiOutlineUser;
export const IconUsers = AiOutlineTeam;
export const IconUserPlus = AiOutlineUserAdd;
export const IconUserCog = AiOutlineUserSwitch;
export const IconEye = AiOutlineEye;
export const IconEyeOff = AiOutlineEyeInvisible;
export const IconLogIn = AiOutlineLogin;
export const IconLogOut = AiOutlineLogout;

// Archivos / Contenido
export const IconFile = AiOutlineFile;
export const IconFileText = AiOutlineFileText;
export const IconFileCheck = AiOutlineFileDone;
export const IconFolderCog = AiOutlineFolderOpen;
export const IconBookOpen = AiOutlineBook;
export const IconRead = AiOutlineRead;

// Edición / CRUD
export const IconEdit = AiOutlineEdit;
export const IconEdit2 = AiOutlineEdit;    // alias
export const IconTrash = AiOutlineDelete;
export const IconTrash2 = AiOutlineDelete;  // alias
export const IconSave = AiOutlineSave;
export const IconPlus = AiOutlinePlus;
export const IconMinus = AiOutlineMinus;
export const IconSearch = AiOutlineSearch;
export const IconFilter = AiOutlineFilter;
export const IconImage = AiOutlinePicture;
export const IconVideo = AiOutlineVideoCameraAdd;
export const IconUpload = AiOutlineUpload;
export const IconUploadCloud = AiOutlineCloudUpload;
export const IconDownload = AiOutlineDownload;

// Estado / Feedback
export const IconCheckCircle = AiOutlineCheckCircle;
export const IconCheckCircle2 = AiOutlineCheckCircle; // alias
export const IconCheck = AiOutlineCheck;
export const IconXCircle = AiOutlineCloseCircle;
export const IconAlertTriangle = AiOutlineWarning;
export const IconAlertCircle = AiOutlineExclamationCircle;
export const IconInfo = AiOutlineInfoCircle;
export const IconLoader = AiOutlineLoading;
export const Loader2 = AiOutlineLoading;     // alias backward-compat

// Tiempo
export const IconClock = AiOutlineClockCircle;
export const IconCalendar = AiOutlineCalendar;
export const IconHistory = AiOutlineHistory;
export const IconRefreshCw = AiOutlineReload;

// Gamificación / Logros
export const IconTrophy = AiOutlineTrophy;
export const IconStar = AiOutlineStar;
export const IconGift = AiOutlineGift;
export const IconAward = AiOutlineTrophy;      // alias

// Layout / Diseño
export const IconGrid = AiOutlineAppstore;
export const IconLayout = AiOutlineLayout;
export const IconLayoutTemplate = AiOutlineLayout;      // alias slides
export const IconDashboard = AiOutlineDashboard;
export const IconLayoutDashboard = AiOutlineDashboard;   // alias
export const IconColumns = AiOutlineColumnWidth;
export const IconList = AiOutlineBars;
export const IconBars = AiOutlineBars;
export const IconGripVertical = AiOutlineDrag;

// Comunicación
export const IconBell = AiOutlineBell;
export const IconMessage = AiOutlineMessage;
export const IconMessageCircle = AiOutlineMessage;     // alias
export const IconMail = AiOutlineMail;
export const IconShare = AiOutlineShareAlt;

// Seguridad / Admin
export const IconShield = AiOutlineSafety;
export const IconLock = AiOutlineLock;
export const IconKey = AiOutlineKey;
export const IconSettings = AiOutlineSetting;

// Media
export const IconPlay = AiOutlinePlayCircle;
export const IconPause = AiOutlinePauseCircle;
export const IconCamera = AiOutlineCamera;
export const IconVolume = AiOutlineSound;

// Analytics
export const IconBarChart = AiOutlineBarChart;
export const IconLineChart = AiOutlineLineChart;
export const IconTrendingUp = AiOutlineRise;
export const IconTarget = AiOutlineAim;
export const IconActivity = AiOutlineRise;        // alias

// Misceláneos
export const IconWifi = AiOutlineWifi;
export const IconWifiOff = AiOutlineDisconnect;
export const IconWrench = AiOutlineTool;
export const IconSparkles = AiOutlineBulb;
export const IconSmile = AiOutlineSmile;
export const IconMapPin = AiOutlineEnvironment;
export const IconZap = AiOutlineThunderbolt;
export const IconMonitor = AiOutlineMonitor;
export const IconPalette = AiOutlineFormatPainter;
export const IconInbox = AiOutlineInbox;
export const IconTag = AiOutlineTags;
export const IconBadge = AiOutlineIdcard;
export const IconCrown = AiOutlineCrown;
export const IconGlobe = AiOutlineGlobal;
export const IconCheckSquare = AiOutlineCheckSquare;
export const IconSquare = AiOutlineCheckSquare; // alias (unchecked = mismo)
export const IconGraduationCap = AiOutlineTrophy;      // alias educativo
export const IconExpand = AiOutlineFullscreen;
export const IconCompress = AiOutlineFullscreenExit;

// Específicos de tipos de slides
export const IconSlideTitle = AiOutlineLayout;
export const IconSlideContent = AiOutlineFileText;
export const IconSlideObjective = AiOutlineAim;
export const IconSlideQuiz = AiOutlineCheckSquare;
export const IconSlideBenefits = AiOutlineBars;
export const IconSlideGrid = AiOutlineAppstore;
export const IconSlideComparison = AiOutlineColumnWidth;
export const IconSlideDefinition = AiOutlineBook;

// ─────────────────────────────────────────────
//  COMPONENTE WRAPPER GENÉRICO
// ─────────────────────────────────────────────
/**
 * Usa este componente cuando el ícono sea dinámico (ej. array de items con íconos variables).
 * @param {Object} props
 * @param {React.ComponentType} props.icon - El componente de ícono a renderizar
 * @param {number} [props.size=20] - Tamaño en px
 */
export function AppIcon({ icon: Icon, size = 20, className, style, ...props }) {
    if (!Icon) return null;
    return <Icon size={size} className={className} style={style} aria-hidden="true" {...props} />;
}
