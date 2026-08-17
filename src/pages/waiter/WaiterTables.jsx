import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';
import { Users, Clock, Plus, Eye, UtensilsCrossed, LayoutGrid, List, Armchair } from 'lucide-react';

function useElapsedTime(createdAt) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  if (!createdAt) return '';
  const diffMs = now - new Date(createdAt).getTime();
  const totalMins = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const STATUS_STYLES = {
  AVAILABLE: {
    card: 'bg-surface border-border hover:border-primary/40 hover:shadow-card-hover',
    badge: 'success',
    dot: 'bg-status-success',
  },
  OCCUPIED: {
    card: 'bg-primary-lighter border-primary/30',
    badge: 'primary',
    dot: 'bg-primary animate-pulse-dot',
  },
  RESERVED: {
    card: 'bg-status-info-bg border-status-info/30',
    badge: 'info',
    dot: 'bg-status-info',
  },
  CLEANING: {
    card: 'bg-gray-50 border-gray-200',
    badge: 'muted',
    dot: 'bg-gray-400',
  },
};

function TableCard({ table, activeOrder, isMyTable, view, onClick }) {
  const elapsed = useElapsedTime(activeOrder?.createdAt);
  const style = STATUS_STYLES[table.status] || STATUS_STYLES.AVAILABLE;
  const isOccupied = table.status === 'OCCUPIED';
  const isReserved = table.status === 'RESERVED';
  const isCleaning = table.status === 'CLEANING';
  const isAvailable = table.status === 'AVAILABLE';

  const reservationTime = table.reservationTime || '06:30 PM'; // Fallback for reserved tables

  if (view === 'list') {
    return (
      <div
        className={cn(
          'w-full flex items-center justify-between px-5 py-4 rounded-2xl border bg-white shadow-card transition-all duration-200 text-left',
          isOccupied && (isMyTable ? 'border-primary ring-1 ring-primary/20 bg-primary-lighter/10' : 'border-status-warning/30 bg-status-warning-bg/10'),
          isReserved && 'border-status-warning/30 bg-status-warning-bg/10',
          isCleaning && 'border-border bg-gray-50/50'
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', style.dot)} />
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-bold text-text-main">Table {table.tableNumber}</span>
              {isMyTable && (
                <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full uppercase tracking-wide">
                  My Table
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {table.capacity} Seats · {table.section}
              </span>
              {isOccupied && activeOrder && (
                <span className="text-xs text-text-muted flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-primary" /> {elapsed}
                </span>
              )}
              {isReserved && (
                <span className="text-xs text-text-muted flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-status-warning" /> {reservationTime}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={style.badge} className="capitalize">{table.status.toLowerCase()}</Badge>
          <Button
            size="sm"
            variant={isOccupied ? (isMyTable ? 'primary' : 'outline') : (isCleaning ? 'secondary' : 'primary')}
            onClick={onClick}
            className="font-bold text-xs h-9 rounded-xl px-4"
          >
            {isAvailable && '+ New Order'}
            {isOccupied && 'View Order'}
            {isReserved && 'View Reservation'}
            {isCleaning && 'Mark Available'}
          </Button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border bg-white shadow-sm hover:shadow-card transition-all duration-200 text-left overflow-hidden h-auto justify-between group',
        isAvailable && 'border-status-success/30 bg-status-success-bg/10',
        isOccupied && (isMyTable ? 'border-primary ring-1 ring-primary/20 bg-primary-lighter/10' : 'border-primary/30 bg-primary-lighter/10'),
        isReserved && 'border-status-info/20 bg-status-info-bg/10',
        isCleaning && 'border-border bg-gray-50/50'
      )}
    >
      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
        {/* Top row: Icon, Table number & Status badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
             <div className={cn(
               "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white",
               isAvailable ? 'bg-status-success' : isOccupied ? 'bg-primary' : isReserved ? 'bg-status-info' : 'bg-gray-400'
             )}>
                <Armchair className="w-5 h-5" />
             </div>
             <p className="text-xl font-black text-text-main leading-none">T{String(table.tableNumber).padStart(2, '0').replace(/^T0*T/, 'T')}</p>
          </div>
          <Badge variant={style.badge} className="capitalize text-[10px] px-2 py-0.5 shrink-0 rounded-lg">
            {table.status.toLowerCase()}
          </Badge>
        </div>

        {/* Middle row: Meta info */}
        <div className="space-y-2 mt-1">
          <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
            <Users className="w-4 h-4" />
            <span>{table.capacity} Seats</span>
            <span className="text-border-strong">•</span>
            <span>{table.section}</span>
          </div>

          {isOccupied && activeOrder && (
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Clock className="w-4 h-4" />
              <span>{elapsed}</span>
            </div>
          )}

          {isReserved && (
            <div className="flex items-center gap-2 text-xs font-bold text-status-info-text">
              <Clock className="w-4 h-4" />
              <span>{reservationTime}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={onClick}
          className={cn(
            "w-full font-bold text-xs h-10 rounded-xl mt-2 transition-colors border",
            isAvailable 
              ? "border-status-success text-status-success hover:bg-status-success hover:text-white" 
              : isOccupied 
                ? "border-primary text-primary hover:bg-primary hover:text-white"
                : isReserved 
                  ? "border-status-info text-status-info hover:bg-status-info hover:text-white"
                  : "border-gray-400 text-gray-500 hover:bg-gray-500 hover:text-white"
          )}
        >
          {isAvailable && '+ New Order'}
          {isOccupied && 'View Order'}
          {isReserved && 'View Reservation'}
          {isCleaning && 'Mark Available'}
        </Button>
      </div>
    </div>
  );
}

const SECTION_ALL = 'All';
const STATUS_ALL = 'All';

export function WaiterTables() {
  const navigate = useNavigate();
  const tables = useSelector(state => state.tables.data);
  const orders = useSelector(state => state.orders.data);
  const { currentUser } = useSelector(state => state.auth);

  const [view, setView] = useState('grid');
  const [statusFilter, setStatusFilter] = useState(STATUS_ALL);
  const [sectionFilter, setSectionFilter] = useState(SECTION_ALL);

  const sections = useMemo(() => {
    const s = new Set(tables.map(t => t.section).filter(Boolean));
    return [SECTION_ALL, ...Array.from(s)];
  }, [tables]);

  const activeTables = tables.filter(t => t.configStatus !== 'INACTIVE' || t.status === 'OCCUPIED');

  const statusCounts = useMemo(() => ({
    All: activeTables.length,
    AVAILABLE: activeTables.filter(t => t.status === 'AVAILABLE').length,
    OCCUPIED: activeTables.filter(t => t.status === 'OCCUPIED').length,
    RESERVED: activeTables.filter(t => t.status === 'RESERVED').length,
    CLEANING: activeTables.filter(t => t.status === 'CLEANING').length,
  }), [activeTables]);

  const filtered = useMemo(() => activeTables.filter(t => {
    const matchStatus = statusFilter === STATUS_ALL || t.status === statusFilter;
    const matchSection = sectionFilter === SECTION_ALL || t.section === sectionFilter;
    return matchStatus && matchSection;
  }), [activeTables, statusFilter, sectionFilter]);

  const STATUS_FILTERS = [
    { key: 'All', label: 'All Tables' },
    { key: 'AVAILABLE', label: 'Available' },
    { key: 'OCCUPIED', label: 'Occupied' },
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Tables</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {statusCounts.OCCUPIED} occupied · {statusCounts.AVAILABLE} available
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-canvas border border-border rounded-xl p-1">
          <button
            onClick={() => setView('grid')}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-lg transition-all',
              view === 'grid' ? 'bg-surface shadow-card text-text-main' : 'text-text-muted hover:text-text-main'
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-lg transition-all',
              view === 'list' ? 'bg-surface shadow-card text-text-main' : 'text-text-muted hover:text-text-main'
            )}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>



      {/* Filters Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status filters */}
        <div className="category-scroll flex-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
                statusFilter === f.key
                  ? 'bg-primary text-white shadow-primary-sm'
                  : 'bg-surface text-text-muted border border-border hover:border-primary/30 hover:text-text-main'
              )}
            >
              {f.label}
              {f.key !== 'All' && (
                <span className={cn(
                  'ml-1.5 text-[10px] font-bold',
                  statusFilter === f.key ? 'text-white/80' : 'text-text-faint'
                )}>
                  {statusCounts[f.key] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Section filter */}
        {sections.length > 2 && (
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="h-10 px-3 pr-8 text-sm font-medium text-text-main bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
          >
            {sections.map(s => (
              <option key={s} value={s}>{s === SECTION_ALL ? 'All Floors' : s}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table Grid / List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-canvas border border-border rounded-2xl flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-7 h-7 text-text-faint" />
            </div>
            <p className="font-semibold text-text-main">No tables found</p>
            <p className="text-sm text-text-muted mt-1">Try adjusting the filters</p>
          </div>
        ) : view === 'list' ? (
          <div className="flex flex-col gap-2 pb-4">
            {filtered.map(table => {
              const activeOrder = orders.find(o => o.tableId === table.id && o.status !== 'CLOSED' && o.status !== 'CANCELLED');
              const isMyTable = activeOrder?.waiterId === currentUser?.id;
              return (
                <TableCard
                  key={table.id}
                  table={table}
                  activeOrder={activeOrder}
                  isMyTable={isMyTable}
                  view="list"
                  onClick={() => navigate(`/waiter/tables/${table.id}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
            {filtered.map(table => {
              const activeOrder = orders.find(o => o.tableId === table.id && o.status !== 'CLOSED' && o.status !== 'CANCELLED');
              const isMyTable = activeOrder?.waiterId === currentUser?.id;
              return (
                <TableCard
                  key={table.id}
                  table={table}
                  activeOrder={activeOrder}
                  isMyTable={isMyTable}
                  view="grid"
                  onClick={() => navigate(`/waiter/tables/${table.id}`)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
