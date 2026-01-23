export const useEmployeeDates = () => {
    // Configuración de plazos del Plan de Formación
    const TRAINING_PLAN_CONFIG = [
        { DEPARTAMENTO: "ALMACÉN", ÁREA: "ALMACÉN", DIAS: 60 },
        { DEPARTAMENTO: "CALIDAD", ÁREA: "A. CALIDAD 1ER TURNO", DIAS: 7 },
        { DEPARTAMENTO: "CALIDAD", ÁREA: "A. CALIDAD 2DO TURNO", DIAS: 7 },
        { DEPARTAMENTO: "CALIDAD", ÁREA: "METROLOGÍA", DIAS: 7 },
        { DEPARTAMENTO: "CALIDAD", ÁREA: "CALIDAD ADMTVO", DIAS: 7 },
        { DEPARTAMENTO: "CALIDAD", ÁREA: "SGI", DIAS: 60 },
        { DEPARTAMENTO: "CALIDAD", ÁREA: "RESIDENTES DE CALIDAD", DIAS: 7 },
        { DEPARTAMENTO: "COMERCIAL", ÁREA: "VENTAS", DIAS: 60 },
        { DEPARTAMENTO: "GERENCIA DE PLANTA", ÁREA: "GERENCIA", DIAS: 60 },
        { DEPARTAMENTO: "LOGISTICA", ÁREA: "LOGISTICA", DIAS: 60 },
        { DEPARTAMENTO: "MANTENIMIENTO", ÁREA: "MANTENIMIENTO", DIAS: 90 },
        { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN ADMTVO", DIAS: 60 },
        { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN MONTAJE", DIAS: 60 },
        { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 1ER TURNO", DIAS: 60 },
        { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 2DO TURNO", DIAS: 60 },
        { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 3ER TURNO", DIAS: 60 },
        { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 4TO TURNO", DIAS: 60 },
        { DEPARTAMENTO: "PROYECTOS", ÁREA: "PROYECTOS", DIAS: 60 },
        { DEPARTAMENTO: "RECURSOS HUMANOS", ÁREA: "RECURSOS HUMANOS", DIAS: 60 },
        { DEPARTAMENTO: "SISTEMAS", ÁREA: "SISTEMAS", DIAS: 60 },
        { DEPARTAMENTO: "TALLER DE MOLDES", ÁREA: "MOLDES", DIAS: 60 }
    ];

    const calculateDates = (startDate) => {
        if (!startDate) return null;

        const start = new Date(startDate);
        if (isNaN(start.getTime())) return null;

        // Fin de contrato: 89 días
        const contractEnd = new Date(start);
        contractEnd.setDate(contractEnd.getDate() + 89);

        // Notificación de renovación: 75 días
        const notificationDate = new Date(start);
        notificationDate.setDate(notificationDate.getDate() + 75);

        // Evaluación 1: 30 días
        const eval1Date = new Date(start);
        eval1Date.setDate(eval1Date.getDate() + 30);

        // Evaluación 2: 60 días
        const eval2Date = new Date(start);
        eval2Date.setDate(eval2Date.getDate() + 60);

        // Evaluación 3: 75 días
        const eval3Date = new Date(start);
        eval3Date.setDate(eval3Date.getDate() + 75);

        return {
            contractEndDate: contractEnd.toISOString().split('T')[0],
            notificationDate: notificationDate.toISOString().split('T')[0],
            eval1Date: eval1Date.toISOString().split('T')[0],
            eval2Date: eval2Date.toISOString().split('T')[0],
            eval3Date: eval3Date.toISOString().split('T')[0]
        };
    };

    const calculateTrainingPlanDate = (startDate, department, area) => {
        if (!startDate || !department || !area) return null;

        // Buscar configuración por departamento y área
        const config = TRAINING_PLAN_CONFIG.find(
            c => c.DEPARTAMENTO.toUpperCase() === department.toUpperCase() &&
                c.ÁREA.toUpperCase() === area.toUpperCase()
        );

        // Si no se encuentra, buscar solo por departamento
        const configByDept = config || TRAINING_PLAN_CONFIG.find(
            c => c.DEPARTAMENTO.toUpperCase() === department.toUpperCase()
        );

        // Si no hay configuración, usar 60 días por defecto
        const days = configByDept?.DIAS || 60;

        const start = new Date(startDate);
        if (isNaN(start.getTime())) return null;

        const deliveryDate = new Date(start);
        deliveryDate.setDate(deliveryDate.getDate() + days);

        return {
            date: deliveryDate.toISOString().split('T')[0],
            days: days
        };
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;
        return `${day}/${month}/${year}`;
    };

    return {
        calculateDates,
        calculateTrainingPlanDate,
        formatDate
    };
};
