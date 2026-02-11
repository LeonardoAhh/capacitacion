/**
 * Formatea un nombre completo para mostrar "Nombre Apellido".
 * Maneja nombres en mayúsculas y formatos comunes.
 * 
 * @param {string} fullName - El nombre completo (ej. "HERNÁNDEZ HERRERA LEONARDO AHMED")
 * @returns {string} - Nombre formateado (ej. "Leonardo Hernández")
 */
export function formatDisplayName(fullName) {
    if (!fullName) return '';

    // Limpiar espacios extra
    const parts = fullName.trim().split(/\s+/);

    // Si tiene menos de 2 partes, retornar tal cual (capitalizado)
    if (parts.length < 2) {
        return toTitleCase(fullName);
    }

    // Heurística común en listas de nómina/RH: APELLIDO1 APELLIDO2 NOMBRE1 (NOMBRE2...)
    // Si tiene 3 o más partes, asumimos que los primeros 2 son apellidos y el resto nombres
    if (parts.length >= 3) {
        const apellido1 = parts[0];
        // const apellido2 = parts[1]; // Ignoramos el segundo apellido p/ brevedad
        const nombre1 = parts[2];

        // Retornar "Nombre1 Apellido1"
        return `${toTitleCase(nombre1)} ${toTitleCase(apellido1)}`;
    }

    // Si tiene 2 partes, asumimos "NOMBRE APELLIDO" o "APELLIDO NOMBRE"
    // Es ambigüo, así que retornamos ambas en Title Case.
    // Pero si el usuario dice que vienen como "HERNANDEZ LEONARDO", y queremos "Leonardo Hernandez",
    // habría que saber el orden exacto.
    // Asumiendo el formato estándar de la App (que parece ser Apellidos Nombres):
    // parts[0] = Apellido, parts[1] = Nombre
    return `${toTitleCase(parts[1])} ${toTitleCase(parts[0])}`;
}

function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}
