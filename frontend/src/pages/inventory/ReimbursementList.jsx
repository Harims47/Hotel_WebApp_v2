import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { Plus, Search, Filter, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const STATUS_VARIANTS = {
  PENDING: 'secondary',
  APPROVED: 'primary',
  PAID: 'success',
  REJECTED: 'danger',
  CANCELLED: 'secondary'
};

export function ReimbursementList() {
  const navigate = useNavigate();
  const reimbursements = useSelector(state => state.reimbursements.data) || [];
  const { currentUser } = useSelector(state => state.auth);
  
  const isGM = currentUser?.role === 'GM';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const filteredReimbursements = reimbursements
    .filter(r => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          r.reimbursementNo?.toLowerCase().includes(search) ||
          r.employeeName?.toLowerCase().includes(search) ||
          r.supplierName?.toLowerCase().includes(search) ||
          r.poNo?.toLowerCase().includes(search) ||
          r.grnNo?.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.ceil(filteredReimbursements.length / itemsPerPage);
  const paginatedReimbursements = filteredReimbursements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reimbursements"
        breadcrumbs="Inventory / Reimbursements"
        actions={!isGM && (
          <Button onClick={() => navigate('/inventory/reimbursements/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Reimbursement
          </Button>
        )}
      />

      <Card className="p-4 flex flex-col sm:flex-row gap-4 border-border/50">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by Employee, Supplier, PO, GRN..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Search reimbursements"
          />
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <select
              value={statusFilter}
              onChange={handleFilterChange}
              className="pl-10 pr-8 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              aria-label="Filter by status"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border-border/50">
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Table.Th>Reimbursement No</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Employee</Table.Th>
                <Table.Th>Source / Links</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </tr>
            </thead>
            <tbody>
              {paginatedReimbursements.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <EmptyState
                      icon={ArrowRight}
                      title="No Reimbursements Found"
                      description={searchTerm ? "Try adjusting your search or filters." : "Create a new reimbursement request."}
                      action={!isGM ? (
                        <Button onClick={() => navigate('/inventory/reimbursements/new')}>
                          Create Reimbursement
                        </Button>
                      ) : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginatedReimbursements.map(reimb => (
                  <tr key={reimb.id}>
                    <Table.Td className="font-medium">{reimb.reimbursementNo}</Table.Td>
                    <Table.Td>{new Date(reimb.reimbursementDate).toLocaleDateString()}</Table.Td>
                    <Table.Td>{reimb.employeeName}</Table.Td>
                    <Table.Td>
                      <div className="flex flex-col gap-1 text-sm">
                        {reimb.supplierName && <span className="text-text-muted">Supplier: {reimb.supplierName}</span>}
                        {reimb.poNo && <span className="text-blue-600">PO: {reimb.poNo}</span>}
                        {reimb.grnNo && <span className="text-emerald-600">GRN: {reimb.grnNo}</span>}
                        {!reimb.supplierName && !reimb.poNo && !reimb.grnNo && <span className="text-text-muted">Direct Expense</span>}
                      </div>
                    </Table.Td>
                    <Table.Td className="font-bold">{formatCurrency(reimb.amount)}</Table.Td>
                    <Table.Td>
                      <Badge variant={STATUS_VARIANTS[reimb.status] || 'secondary'}>
                        {reimb.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/inventory/reimbursements/${reimb.id}`)}>
                        View
                      </Button>
                    </Table.Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </Card>
    </div>
  );
}
