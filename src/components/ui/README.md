# 🎨 Componentes UI estilo shadcn/ui

Biblioteca de componentes UI minimalistas y funcionales para el Sistema de Gestión de Empleados.

## 📦 Instalación

Todos los componentes están disponibles en `@/components/ui`. Puedes importarlos individualmente o desde el archivo index:

```javascript
// Importación individual
import { Badge } from '@/components/ui/Badge/Badge';

// Importación desde index
import { Badge, Button, Card, Dialog } from '@/components/ui';
```

---

## 🏷️ Badge

Indicadores de estado visuales.

```jsx
import { Badge } from '@/components/ui';

// Variantes
<Badge variant="default">Default</Badge>
<Badge variant="success">Completado</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="danger">Vencido</Badge>
<Badge variant="info">Información</Badge>

// Con indicador pulsante
<Badge variant="success" dot>En línea</Badge>

// Tamaños
<Badge size="sm">Pequeño</Badge>
<Badge size="md">Mediano</Badge>
<Badge size="lg">Grande</Badge>
```

---

## 🔘 Button

Botones con múltiples variantes y estados.

```jsx
import { Button, IconButton } from '@/components/ui';

// Variantes
<Button variant="primary">Primario</Button>
<Button variant="secondary">Secundario</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Peligro</Button>
<Button variant="success">Éxito</Button>

// Con icono
<Button icon={<PlusIcon />}>Agregar</Button>
<Button icon={<SaveIcon />} iconPosition="right">Guardar</Button>

// Estado de carga
<Button loading>Guardando...</Button>

// Tamaños
<Button size="sm">Pequeño</Button>
<Button size="lg">Grande</Button>

// Ancho completo
<Button fullWidth>Botón Completo</Button>

// IconButton (solo icono)
<IconButton variant="ghost"><EditIcon /></IconButton>
<IconButton variant="danger"><TrashIcon /></IconButton>
```

---

## 📄 Card

Contenedores para agrupar contenido.

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

<Card>
    <CardHeader>
        <CardTitle>Título de la Tarjeta</CardTitle>
        <CardDescription>Descripción opcional</CardDescription>
    </CardHeader>
    <CardContent>
        <p>Contenido de la tarjeta...</p>
    </CardContent>
    <CardFooter>
        <Button variant="secondary">Cancelar</Button>
        <Button>Guardar</Button>
    </CardFooter>
</Card>

// Sin hover effect
<Card hover={false}>...</Card>
```

---

## 💬 Dialog

Modales para confirmaciones y formularios.

```jsx
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose } from '@/components/ui';

const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Abrir Modal</Button>

<Dialog open={open} onOpenChange={setOpen}>
    <DialogHeader>
        <DialogTitle>¿Eliminar empleado?</DialogTitle>
        <DialogDescription>
            Esta acción no se puede deshacer.
        </DialogDescription>
        <DialogClose onClose={() => setOpen(false)} />
    </DialogHeader>
    <DialogBody>
        <p>El empleado será eliminado permanentemente.</p>
    </DialogBody>
    <DialogFooter>
        <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
        </Button>
        <Button variant="danger" onClick={handleDelete}>
            Eliminar
        </Button>
    </DialogFooter>
</Dialog>
```

---

## 🔔 Toast

Notificaciones temporales.

```jsx
import { useToast } from '@/components/ui';

function MyComponent() {
    const { toast } = useToast();

    const handleSave = () => {
        // Variantes
        toast.success('¡Guardado!', 'El empleado se guardó correctamente.');
        toast.error('Error', 'No se pudo guardar el empleado.');
        toast.warning('Advertencia', 'Algunos campos están vacíos.');
        toast.info('Información', 'Revisa los datos antes de continuar.');
    };

    return <Button onClick={handleSave}>Guardar</Button>;
}
```

---

## 👤 Avatar

Avatares con imagen o iniciales.

```jsx
import { Avatar, AvatarGroup } from '@/components/ui';

// Con imagen
<Avatar src="/foto.jpg" alt="Juan Pérez" />

// Con iniciales (auto-generadas)
<Avatar name="Juan Pérez" />

// Tamaños
<Avatar name="Juan" size="xs" />
<Avatar name="Juan" size="sm" />
<Avatar name="Juan" size="md" />
<Avatar name="Juan" size="lg" />
<Avatar name="Juan" size="xl" />

// Grupo de avatares
<AvatarGroup max={3}>
    <Avatar name="Juan Pérez" />
    <Avatar name="María García" />
    <Avatar name="Carlos López" />
    <Avatar name="Ana Martínez" />
</AvatarGroup>
```

---

## 📊 Progress

Barras e indicadores de progreso.

```jsx
import { Progress, CircularProgress } from '@/components/ui';

// Barra lineal
<Progress value={75} />

// Con valor visible
<Progress value={75} showValue />

// Variantes
<Progress value={100} variant="success" />
<Progress value={50} variant="warning" />
<Progress value={25} variant="danger" />

// Tamaños
<Progress value={75} size="sm" />
<Progress value={75} size="lg" />

// Progreso circular
<CircularProgress value={75} />
<CircularProgress value={75} size={80} strokeWidth={8} />
<CircularProgress value={100} variant="success" />
```

---

## 💀 Skeleton

Estados de carga elegantes.

```jsx
import { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar, SkeletonTable } from '@/components/ui';

// Básico
<Skeleton width={200} height={20} />
<Skeleton variant="circular" width={40} height={40} />
<Skeleton variant="rectangular" height={160} />

// Presets
<SkeletonText lines={3} />
<SkeletonCard />
<SkeletonAvatar withText />
<SkeletonTable rows={5} columns={4} />
```

---

## 📋 Select

Dropdown personalizado con búsqueda.

```jsx
import { Select } from '@/components/ui';

const options = [
    { value: 'produccion', label: 'Producción' },
    { value: 'calidad', label: 'Calidad' },
    { value: 'almacen', label: 'Almacén' },
];

<Select
    value={department}
    onChange={setDepartment}
    options={options}
    placeholder="Seleccionar departamento..."
/>

// Con búsqueda
<Select
    value={department}
    onChange={setDepartment}
    options={options}
    searchable
/>
```

---

## ✏️ Input

Campos de entrada mejorados.

```jsx
import { Input, Textarea } from '@/components/ui';

// Básico
<Input placeholder="Escribe aquí..." />

// Con label
<Input label="Nombre" placeholder="Nombre completo" required />

// Con icono
<Input 
    icon={<SearchIcon />}
    placeholder="Buscar..."
/>

// Con error
<Input 
    label="Email" 
    error="El email no es válido" 
/>

// Textarea
<Textarea 
    label="Comentarios"
    placeholder="Escribe tus comentarios..."
    rows={4}
/>
```

---

## 📑 Tabs

Navegación por pestañas.

```jsx
import { TabsComplete } from '@/components/ui';

const tabs = [
    { 
        value: 'general', 
        label: 'General',
        icon: <UserIcon />,
        content: <GeneralForm />
    },
    { 
        value: 'detalles', 
        label: 'Detalles',
        content: <DetailsForm />
    },
];

<TabsComplete tabs={tabs} defaultValue="general" />
```

---

## 📋 DataTable

Tabla de datos con búsqueda, ordenamiento y paginación.

```jsx
import { DataTable } from '@/components/ui';

const columns = [
    { 
        accessorKey: 'employeeId', 
        header: 'ID',
        sortable: true,
        width: '100px'
    },
    { 
        accessorKey: 'name', 
        header: 'Nombre',
        sortable: true
    },
    { 
        accessorKey: 'department', 
        header: 'Departamento',
        sortable: true
    },
    {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ value }) => <Badge variant={value === 'active' ? 'success' : 'warning'}>{value}</Badge>
    }
];

<DataTable
    data={employees}
    columns={columns}
    searchable
    searchPlaceholder="Buscar empleado..."
    pagination
    pageSize={10}
    onRowClick={(row) => console.log('Clicked:', row)}
    emptyMessage="No hay empleados registrados"
/>
```

---

## 🎨 Colores de las Variantes

| Variante | Color | Uso |
|----------|-------|-----|
| `default` | Gris | Estado neutral |
| `primary` | Azul | Acciones principales |
| `secondary` | Púrpura | Acciones secundarias |
| `success` | Verde | Éxito, completado |
| `warning` | Ámbar | Advertencias, pendiente |
| `danger` | Rojo | Peligro, eliminar |
| `info` | Azul claro | Información |

---

## 💡 Tips

1. **Consistencia**: Usa las mismas variantes para acciones similares en toda la app.
2. **Feedback**: Siempre muestra estados de carga con `loading` en botones.
3. **Accesibilidad**: Todos los componentes incluyen soporte ARIA.
4. **Temas**: Los componentes respetan el tema claro/oscuro automáticamente.
