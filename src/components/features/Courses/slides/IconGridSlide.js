'use client';
import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

import styles from './slides.module.css';
import {
  AiOutlineEye, AiOutlineSearch, AiOutlineMessage, AiOutlineStar,
  AiOutlineCheckCircle, AiOutlineBulb, AiOutlineTrophy, AiOutlineThunderbolt,
  AiOutlineUser, AiOutlineTeam, AiOutlineSafety, AiOutlineRise,
  AiOutlineGlobal, AiOutlineHeart, AiOutlineBook, AiOutlineTool,
  AiOutlineCalendar, AiOutlineBell, AiOutlineLock, AiOutlineSmile,
  AiOutlineFlag, AiOutlineCrown, AiOutlineRocket, AiOutlineFire,
  AiOutlineAim, AiOutlineClockCircle, AiOutlineComment, AiOutlineLike,
  AiOutlineDislike, AiOutlineBarChart, AiOutlineLineChart,
  AiOutlineWifi, AiOutlineMail, AiOutlinePhone, AiOutlineEnvironment,
  // Nuevos
  AiOutlineFileText, AiOutlineFolder, AiOutlineCloud, AiOutlineCamera,
  AiOutlineVideoCamera, AiOutlineSound, AiOutlinePlayCircle,
  AiOutlineDownload, AiOutlineUpload, AiOutlineShareAlt,
  AiOutlineEdit, AiOutlineCheckSquare, AiOutlineInfoCircle, AiOutlineWarning,
  AiOutlineHome, AiOutlineAppstore, AiOutlineLayout, AiOutlineDashboard,
  AiOutlineBars, AiOutlineLogin, AiOutlineLogout,
  AiOutlineSetting, AiOutlineControl, AiOutlineTag,
  AiOutlineIdcard, AiOutlineKey, AiOutlinePrinter,
  AiOutlineMonitor, AiOutlineMobile, AiOutlineTablet,
  AiOutlineDatabase, AiOutlineApi, AiOutlineCode,
  AiOutlineBug, AiOutlineExperiment, AiOutlineFormatPainter,
  AiOutlineGift, AiOutlineCoffee, AiOutlineMedicineBox,
  AiOutlineBank, AiOutlineBuild, AiOutlineApartment,
  AiOutlineShopping, AiOutlineShoppingCart, AiOutlineCreditCard,
  AiOutlineReconciliation, AiOutlineFileDone, AiOutlineFileSearch,
  AiOutlineContacts, AiOutlineSchedule,
  AiOutlineBoxPlot, AiOutlinePieChart, AiOutlineAreaChart,
  AiOutlineFundProjectionScreen,
  AiOutlineUserAdd, AiOutlineUserSwitch,
  AiOutlineDisconnect, AiOutlineInbox,
  AiOutlineSend,
} from 'react-icons/ai';

/**
 * Mapa canónico de íconos: nombre guardado en Firestore → componente react-icon.
 * DEBE estar sincronizado con ICON_CATALOG de IconPicker.js.
 */
const ICON_MAP = {
  // Personas / Equipo
  User: AiOutlineUser,
  Team: AiOutlineTeam,
  Users: AiOutlineTeam,       // alias legado
  UserAdd: AiOutlineUserAdd,
  UserSwitch: AiOutlineUserSwitch,
  Contacts: AiOutlineContacts,
  Idcard: AiOutlineIdcard,
  Crown: AiOutlineCrown,

  // Comunicación
  Message: AiOutlineMessage,
  MessageCircle: AiOutlineMessage,    // alias legado
  Comment: AiOutlineComment,
  Mail: AiOutlineMail,
  Bell: AiOutlineBell,
  Phone: AiOutlinePhone,
  Send: AiOutlineSend,
  Share: AiOutlineShareAlt,
  Inbox: AiOutlineInbox,
  Wifi: AiOutlineWifi,
  Disconnect: AiOutlineDisconnect,

  // Logros / Motivación
  Star: AiOutlineStar,
  Trophy: AiOutlineTrophy,
  Fire: AiOutlineFire,
  Rocket: AiOutlineRocket,
  Heart: AiOutlineHeart,
  Like: AiOutlineLike,
  ThumbsUp: AiOutlineLike,       // alias legado
  Gift: AiOutlineGift,
  Flag: AiOutlineFlag,
  Smile: AiOutlineSmile,
  Dislike: AiOutlineDislike,

  // Aprendizaje / Conocimiento
  Bulb: AiOutlineBulb,
  Lightbulb: AiOutlineBulb,       // alias legado
  Book: AiOutlineBook,
  Experiment: AiOutlineExperiment,
  Eye: AiOutlineEye,
  Search: AiOutlineSearch,
  FileSearch: AiOutlineFileSearch,
  Clipboard: AiOutlineFileDone,
  FileDone: AiOutlineFileDone,
  Schedule: AiOutlineSchedule,

  // Objetivos / Productividad
  Aim: AiOutlineAim,
  Thunderbolt: AiOutlineThunderbolt,
  Zap: AiOutlineThunderbolt, // alias legado
  Rise: AiOutlineRise,
  TrendingUp: AiOutlineRise,        // alias legado
  CheckCircle: AiOutlineCheckCircle,
  CheckSquare: AiOutlineCheckSquare,
  Clock: AiOutlineClockCircle,
  Calendar: AiOutlineCalendar,
  FundScreen: AiOutlineFundProjectionScreen,

  // Seguridad / Salud
  Safety: AiOutlineSafety,
  Shield: AiOutlineSafety,      // alias legado
  Lock: AiOutlineLock,
  Key: AiOutlineKey,
  Medicine: AiOutlineMedicineBox,
  Warning: AiOutlineWarning,
  Info: AiOutlineInfoCircle,
  Bug: AiOutlineBug,

  // Tecnología / Sistemas
  Monitor: AiOutlineMonitor,
  Mobile: AiOutlineMobile,
  Tablet: AiOutlineTablet,
  Database: AiOutlineDatabase,
  Api: AiOutlineApi,
  Code: AiOutlineCode,
  Cloud: AiOutlineCloud,
  Upload: AiOutlineUpload,
  Download: AiOutlineDownload,
  Printer: AiOutlinePrinter,

  // Negocio / Operaciones
  Tool: AiOutlineTool,
  Build: AiOutlineBuild,
  Bank: AiOutlineBank,
  Shopping: AiOutlineShopping,
  Cart: AiOutlineShoppingCart,
  CreditCard: AiOutlineCreditCard,
  Reconciliation: AiOutlineReconciliation,
  Setting: AiOutlineSetting,
  Control: AiOutlineControl,
  Apartment: AiOutlineApartment,
  Location: AiOutlineEnvironment,
  Globe: AiOutlineGlobal,      // alias legado
  Global: AiOutlineGlobal,

  // Datos / Análisis
  BarChart: AiOutlineBarChart,
  LineChart: AiOutlineLineChart,
  PieChart: AiOutlinePieChart,
  AreaChart: AiOutlineAreaChart,
  BoxPlot: AiOutlineBoxPlot,

  // Archivos / Contenido
  FileText: AiOutlineFileText,
  Folder: AiOutlineFolder,
  Tag: AiOutlineTag,

  // Multimedia
  Camera: AiOutlineCamera,
  Video: AiOutlineVideoCamera,
  Sound: AiOutlineSound,
  Play: AiOutlinePlayCircle,

  // UI / Navegación
  Home: AiOutlineHome,
  Dashboard: AiOutlineDashboard,
  Appstore: AiOutlineAppstore,
  Layout: AiOutlineLayout,
  List: AiOutlineBars,
  Edit: AiOutlineEdit,
  FormatPainter: AiOutlineFormatPainter,
  Login: AiOutlineLogin,
  Logout: AiOutlineLogout,
  Coffee: AiOutlineCoffee,

  // Iconos específicos de slides tipo Courses (alias legados)
  IconStar: AiOutlineStar,
};

/**
 * Imagen con fallback visual cuando src está vacío o falla la carga.
 * Muestra solo el ícono ImageOff (sin texto) en un wrapper cuadrado.
 */
function ImgWithFallback({ src, alt, className, style }) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          aspectRatio: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--ds-bg)',
          borderRadius: 8,
          border: '1px dashed var(--ds-border-hairline)',
          color: 'var(--ds-text-tertiary)',
          ...style,
        }}
        aria-hidden="true"
      >
        <ImageOff size={28} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
}

/** Número máximo de ítems permitidos en un IconGridSlide */
const MAX_ITEMS = 6;

/**
 * IconGridSlide — Grid de íconos con máximo 6 ítems
 * Layout responsivo inteligente:
 *   1 ítem  → 1 col
 *   2 ítems → 2 col
 *   3 ítems → 3 col
 *   4 ítems → 2 col × 2 filas
 *   5-6 ítems → 3 col × 2 filas
 */
const IconGridSlide = React.memo(function IconGridSlide({ data, inline = false, hasBgMedia }) {
  const { heading, description, items = [] } = data;

  // Aplicar límite de 6 ítems
  const visibleItems = items.slice(0, MAX_ITEMS);
  const count = visibleItems.length;

  // Determinar columnas óptimas según cantidad
  const getGridCols = (n) => {
    if (n <= 1) return 'cols1';
    if (n <= 2) return 'cols2';
    if (n <= 3) return 'cols3';
    if (n <= 4) return 'cols2';   // 2×2
    return 'cols3';                // 3×2 (5 o 6)
  };

  const colsClass = styles[getGridCols(count)] || '';

  return (
    <article
      className={`${styles.slide} ${styles.iconGridSlide} ${hasBgMedia ? styles.slideOverBg : ''} ${inline ? styles.slideInline : ''}`}
      role="region"
      aria-label={heading || 'Íconos del contenido'}
    >
      <h2 className={styles.slideTitle}>{heading}</h2>
      {description && <p className={styles.slideDescription}>{description}</p>}

      <div
        className={`${styles.iconGrid} ${colsClass}`}
        role="list"
        data-count={count}
      >
        {visibleItems.map((item, idx) => {
          // Buscar el ícono — fallback a Bulb si no existe
          const IconComponent = ICON_MAP[item.icon] || AiOutlineBulb;

          return (
            <div
              key={idx}
              className={styles.gridItem}
              role="listitem"
            >
              <div className={styles.iconWrapper} aria-hidden="true">
                {item.image ? (
                  <ImgWithFallback
                    src={item.image}
                    alt=""
                    className={styles.gridItemImage}
                  />
                ) : (
                  <IconComponent size={32} />
                )}
              </div>
              <h3 className={styles.iconLabel}>{item.label}</h3>
              {item.description && (
                <p className={styles.iconSublabel}>{item.description}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Aviso si se truncaron ítems (solo visible para el editor/admin) */}
      {inline && items.length > MAX_ITEMS && (
        <p style={{ fontSize: '0.72rem', color: 'var(--color-danger)', textAlign: 'center', marginTop: 8 }}>
          ⚠️ Solo se muestran los primeros {MAX_ITEMS} iconos (máx. permitido)
        </p>
      )}
    </article>
  );
});

export default IconGridSlide;
