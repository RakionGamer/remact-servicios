import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, FileText, DollarSign } from "lucide-react"
import { getDashboardStats } from "@/actions/dashboard"
import { getSession } from "@/actions/auth"
import { OverviewChart } from "@/components/dashboard/OverviewChart"

export const dynamic = 'force-dynamic';

export default async function DashboardInicio() {
  const session = await getSession();
  const isAdmin = session?.rol === 'ADMIN';

  const result = await getDashboardStats();
  
  let stats = {
    ingresos: 0,
    clientes: 0,
    servicios: 0,
    presupuestos: 0,
    chartData: [] as any[]
  };

  if (result.success && result.data) {
    stats = result.data;
  }

  // Relleno visual en caso de que la BD esté vacía y no haya presupuestos
  if (stats.chartData.length === 0) {
    stats.chartData = [
      { month: "Sin datos", presupuestos: 0, ingresos: 0 }
    ];
  }

  // Formateador de moneda para CLP
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Inicio</h1>
      
      {/* Tarjetas de Estadísticas Top */}
      <div className={`grid gap-4 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-2'}`}>
        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.ingresos)}</div>
            <p className="text-xs text-muted-foreground">Histórico acumulado</p>
          </CardContent>
        </Card>
        )}
        {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Registrados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientes}</div>
            <p className="text-xs text-muted-foreground">En base de datos</p>
          </CardContent>
        </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios en Catálogo</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.servicios}</div>
            <p className="text-xs text-muted-foreground">Opciones configuradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuestos Emitidos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presupuestos}</div>
            <p className="text-xs text-muted-foreground">Presupuestos totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos con Shadcn Chart (Recharts) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 md:col-span-7">
          <CardHeader>
            <CardTitle>{isAdmin ? "Resumen de Rendimiento Financiero" : "Evolución de Presupuestos"}</CardTitle>
            <CardDescription>
              {isAdmin ? "Comparativa de presupuestos emitidos vs ingresos generados (últimos 6 meses)." : "Presupuestos emitidos en los últimos 6 meses."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart data={stats.chartData} hideIngresos={!isAdmin} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
