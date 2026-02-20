'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '@/lib/utils';
import styles from './Charts.module.css';

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' };

/**
 * @typedef {Object} ChartConfigItem
 * @property {React.ReactNode} [label]
 * @property {React.ComponentType} [icon]
 * @property {string} [color]
 * @property {Object.<string, string>} [theme]
 */

/**
 * @typedef {Object.<string, ChartConfigItem>} ChartConfig
 */

const ChartContext = React.createContext(null);

function useChart() {
    const context = React.useContext(ChartContext);
    if (!context) {
        throw new Error('useChart must be used within a <ChartContainer />');
    }
    return context;
}

function ChartContainer({
    id,
    className,
    children,
    config,
    ...props
}) {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

    return (
        <ChartContext.Provider value={{ config }}>
            <div
                data-slot="chart"
                data-chart={chartId}
                className={cn(styles.chartContainer, className)}
                {...props}
            >
                <ChartStyle id={chartId} config={config} />
                <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
                    {children}
                </RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
}

function ChartStyle({ id, config }) {
    const colorConfig = Object.entries(config).filter(
        ([, configItem]) => configItem.theme || configItem.color
    );

    if (!colorConfig.length) {
        return null;
    }

    return (
        <style
            dangerouslySetInnerHTML={{
                __html: Object.entries(THEMES)
                    .map(
                        ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
                                .map(([key, itemConfig]) => {
                                    const color =
                                        itemConfig.theme?.[theme] ||
                                        itemConfig.color;
                                    return color ? `  --color-${key}: ${color};` : null;
                                })
                                .filter(Boolean)
                                .join('\n')}
}
`
                    )
                    .join('\n'),
            }}
        />
    );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
    active,
    payload,
    className,
    indicator = 'dot',
    hideLabel = false,
    hideIndicator = false,
    label,
    labelFormatter,
    labelClassName,
    formatter,
    color,
    nameKey,
    labelKey,
}) {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
        if (hideLabel || !payload?.length) {
            return null;
        }

        const [item] = payload;
        const key = `${labelKey || item?.dataKey || item?.name || 'value'}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        const value =
            !labelKey && typeof label === 'string'
                ? config[label]?.label || label
                : itemConfig?.label;

        if (labelFormatter) {
            return (
                <div className={cn(styles.tooltipLabel, labelClassName)}>
                    {labelFormatter(value, payload)}
                </div>
            );
        }

        if (!value) {
            return null;
        }

        return <div className={cn(styles.tooltipLabel, labelClassName)}>{value}</div>;
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

    if (!active || !payload?.length) {
        return null;
    }

    const nestLabel = payload.length === 1 && indicator !== 'dot';

    return (
        <div className={cn(styles.tooltipContent, className)}>
            {!nestLabel ? tooltipLabel : null}
            <div className={styles.tooltipItems}>
                {payload
                    .filter((item) => item.type !== 'none')
                    .map((item, index) => {
                        const key = `${nameKey || item.name || item.dataKey || 'value'}`;
                        const itemConfig = getPayloadConfigFromPayload(config, item, key);
                        const indicatorColor = color || item.payload.fill || item.color;

                        return (
                            <div
                                key={item.dataKey || index}
                                className={cn(
                                    styles.tooltipItem,
                                    indicator === 'dot' && styles.tooltipItemDot
                                )}
                            >
                                {formatter && item?.value !== undefined && item.name ? (
                                    formatter(item.value, item.name, item, index, item.payload)
                                ) : (
                                    <>
                                        {itemConfig?.icon ? (
                                            <itemConfig.icon />
                                        ) : (
                                            !hideIndicator && (
                                                <div
                                                    className={cn(
                                                        styles.indicator,
                                                        indicator === 'dot' && styles.indicatorDot,
                                                        indicator === 'line' && styles.indicatorLine,
                                                        indicator === 'dashed' && styles.indicatorDashed
                                                    )}
                                                    style={{
                                                        '--indicator-color': indicatorColor,
                                                    }}
                                                />
                                            )
                                        )}
                                        <div
                                            className={cn(
                                                styles.tooltipItemContent,
                                                nestLabel && styles.tooltipItemContentNested
                                            )}
                                        >
                                            <div className={styles.tooltipItemLabels}>
                                                {nestLabel ? tooltipLabel : null}
                                                <span className={styles.tooltipItemName}>
                                                    {itemConfig?.label || item.name}
                                                </span>
                                            </div>
                                            {item.value !== undefined && (
                                                <span className={styles.tooltipItemValue}>
                                                    {typeof item.value === 'number'
                                                        ? item.value.toLocaleString()
                                                        : item.value}
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
    className,
    hideIcon = false,
    payload,
    verticalAlign = 'bottom',
    nameKey,
}) {
    const { config } = useChart();

    if (!payload?.length) {
        return null;
    }

    return (
        <div
            className={cn(
                styles.legendContent,
                verticalAlign === 'top' ? styles.legendTop : styles.legendBottom,
                className
            )}
        >
            {payload
                .filter((item) => item.type !== 'none')
                .map((item) => {
                    const key = `${nameKey || item.dataKey || 'value'}`;
                    const itemConfig = getPayloadConfigFromPayload(config, item, key);

                    return (
                        <div key={item.value} className={styles.legendItem}>
                            {itemConfig?.icon && !hideIcon ? (
                                <itemConfig.icon />
                            ) : (
                                <div
                                    className={styles.legendIndicator}
                                    style={{ backgroundColor: item.color }}
                                />
                            )}
                            <span className={styles.legendLabel}>{itemConfig?.label || item.value}</span>
                        </div>
                    );
                })}
        </div>
    );
}

function getPayloadConfigFromPayload(config, payload, key) {
    if (typeof payload !== 'object' || payload === null) {
        return undefined;
    }

    const payloadPayload =
        'payload' in payload &&
            typeof payload.payload === 'object' &&
            payload.payload !== null
            ? payload.payload
            : undefined;

    let configLabelKey = key;

    if (key in payload && typeof payload[key] === 'string') {
        configLabelKey = payload[key];
    } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === 'string') {
        configLabelKey = payloadPayload[key];
    }

    return configLabelKey in config ? config[configLabelKey] : config[key];
}

export {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    ChartStyle,
};
