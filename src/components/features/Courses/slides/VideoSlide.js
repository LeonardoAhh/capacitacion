'use client';
import React from 'react';
import styles from './slides.module.css';

const isYouTubeEmbed = (url) => !!url && url.includes('youtube.com/embed');
const isDirectVideo  = (url) => !!url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

/**
 * VideoSlide — Slide con video embebido (YouTube o MP4/WEBM directo)
 * @param {{ heading, videoUrl, caption, autoplay }} props.data
 */
const VideoSlide = React.memo(function VideoSlide({ data, inline, hasBgMedia }) {
    const { heading, videoUrl, caption, autoplay } = data;

    const ytParams = autoplay && !inline
        ? '?rel=0&modestbranding=1&autoplay=1&mute=1'
        : '?rel=0&modestbranding=1';

    const ytSrc   = isYouTubeEmbed(videoUrl) ? `${videoUrl}${ytParams}` : null;
    const isDirect = isDirectVideo(videoUrl);

    return (
        <article
            className={`${styles.slide} ${styles.videoSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
            role="region"
            aria-label={heading || 'Slide de video'}
        >
            <span className={styles.slideLabel}>Video</span>
            {heading && <h2 className={styles.videoHeading}>{heading}</h2>}

            <div className={styles.videoWrapper}>
                {ytSrc ? (
                    <iframe
                        src={ytSrc}
                        title={heading || 'Video del curso'}
                        className={styles.videoIframe}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                    />
                ) : isDirect ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video
                        className={styles.videoNative}
                        controls
                        autoPlay={!!autoplay && !inline}
                        muted={!!autoplay}
                        playsInline
                        src={videoUrl}
                    />
                ) : (
                    <div className={styles.videoPlaceholder} role="img" aria-label="Placeholder de video">
                        <span style={{ fontSize: '2.5rem' }} aria-hidden="true">▶</span>
                        <p>{videoUrl ? 'URL de video no reconocida' : 'Sin URL de video configurada'}</p>
                    </div>
                )}
            </div>

            {caption && (
                <p className={styles.videoCaption}>{caption}</p>
            )}
        </article>
    );
});

export default VideoSlide;
