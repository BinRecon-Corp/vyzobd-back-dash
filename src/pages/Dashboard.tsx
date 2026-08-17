import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { DollarSign, Users, ShoppingBag, TrendingUp, ShieldAlert, ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getAuditLogs, AuditLog } from '../services/auditLog.service';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

const data = [
  { name: 'Jan', total: 1200 },
  { name: 'Feb', total: 2100 },
  { name: 'Mar', total: 1800 },
  { name: 'Apr', total: 2400 },
  { name: 'May', total: 2800 },
  { name: 'Jun', total: 3200 },
  { name: 'Jul', total: 4100 },
];

export function Dashboard() {
  const [securityEvents, setSecurityEvents] = useState<AuditLog[]>([]);
  const [fetchingLogs, setFetchingLogs] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setFetchingLogs(true);
        const res = await getAuditLogs({ limit: 5 });
        setSecurityEvents(res.logs);
      } catch (err) {
        console.error("Failed to load dashboard security events:", err);
      } finally {
        setFetchingLogs(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground mt-1">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +19% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.24%</div>
            <p className="text-xs text-muted-foreground mt-1">
              +0.2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    OM
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Olivia Martin</p>
                    <p className="text-sm text-muted-foreground">olivia.martin@email.com</p>
                  </div>
                  <div className="ml-auto font-medium">+$1,999.00</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Recent Security &amp; Admin Audit Events
            </CardTitle>
            <CardDescription className="text-xs">
              A real-time ledger of administrative operations, staff actions, and access alerts.
            </CardDescription>
          </div>
          <Link to="/settings/audit-logs">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 flex items-center gap-1">
              View All Logs
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {fetchingLogs && securityEvents.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              Fetching security events...
            </div>
          ) : securityEvents.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-sm">
              No recent security logs found.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {securityEvents.map((event) => {
                const isFailed = event.action.includes("FAILED") || event.action.includes("ALERT") || event.action.includes("LOCKED") || event.action.includes("REVOKED");
                const isSuccess = event.action.includes("SUCCESS") || event.action.includes("CREATED") || event.action.includes("ENABLED");
                
                return (
                  <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full mt-0.5 ${
                        isFailed ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
                        isSuccess ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                        "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {isFailed ? <ShieldAlert className="h-4 w-4" /> :
                         isSuccess ? <ShieldCheck className="h-4 w-4" /> :
                         <Lock className="h-4 w-4" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">{event.action}</span>
                          <span className="text-xs font-mono text-muted-foreground">({event.entityType})</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Actor: <strong className="text-foreground">{event.user ? `${event.user.firstName} ${event.user.lastName || ""}`.trim() : "System"}</strong> 
                          {event.user?.email && ` (${event.user.email})`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center text-xs text-muted-foreground">
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded sm:mb-1">{event.ipAddress || "Localhost"}</span>
                      <span>{new Date(event.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
