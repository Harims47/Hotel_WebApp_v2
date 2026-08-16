import { v4 as uuidv4 } from 'uuid';
import { createRecord, updateRecord, updateStatus } from './reimbursementSlice';
import { logAction } from '../audit/auditSlice';
import { addNotification } from '../notifications/notificationsSlice';
import { formatCurrency } from '../../utils/currency';

export const createReimbursement = (reimbursementData, currentUser) => (dispatch) => {
  const newReimbursement = {
    ...reimbursementData,
    id: `reimb-${uuidv4()}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    createdBy: currentUser?.id,
    requestedAt: new Date().toISOString()
  };

  dispatch(createRecord(newReimbursement));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: currentUser?.id,
    action: 'REIMBURSEMENT_CREATED',
    entityType: 'REIMBURSEMENT',
    entityId: newReimbursement.id,
    description: `Reimbursement ${newReimbursement.reimbursementNo} created for ${newReimbursement.employeeName}`,
    createdAt: new Date().toISOString()
  }));

  dispatch(addNotification({
    id: `notif-${uuidv4()}`,
    title: 'Reimbursement Submitted',
    message: `Reimbursement ${newReimbursement.reimbursementNo} submitted by ${newReimbursement.employeeName} — ${formatCurrency(newReimbursement.amount)}`,
    type: 'INFO',
    createdAt: new Date().toISOString(),
    isRead: false
  }));
};

export const updateReimbursement = (reimbursementData, currentUser) => (dispatch) => {
  dispatch(updateRecord(reimbursementData));
  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: currentUser?.id,
    action: 'REIMBURSEMENT_UPDATED',
    entityType: 'REIMBURSEMENT',
    entityId: reimbursementData.id,
    description: `Reimbursement ${reimbursementData.reimbursementNo} updated`,
    createdAt: new Date().toISOString()
  }));
};

export const approveReimbursement = (reimbursement, currentUser) => (dispatch) => {
  const updatedFields = {
    approvedAt: new Date().toISOString(),
    approvedBy: currentUser?.id
  };

  dispatch(updateStatus({ id: reimbursement.id, status: 'APPROVED', updatedFields }));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: currentUser?.id,
    action: 'REIMBURSEMENT_APPROVED',
    entityType: 'REIMBURSEMENT',
    entityId: reimbursement.id,
    description: `Reimbursement ${reimbursement.reimbursementNo} approved`,
    createdAt: new Date().toISOString()
  }));

  dispatch(addNotification({
    id: `notif-${uuidv4()}`,
    title: 'Reimbursement Approved',
    message: `Reimbursement ${reimbursement.reimbursementNo} approved — ${formatCurrency(reimbursement.amount)}`,
    type: 'SUCCESS',
    createdAt: new Date().toISOString(),
    isRead: false
  }));
};

export const rejectReimbursement = (reimbursement, currentUser) => (dispatch) => {
  dispatch(updateStatus({ id: reimbursement.id, status: 'REJECTED', updatedFields: {} }));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: currentUser?.id,
    action: 'REIMBURSEMENT_REJECTED',
    entityType: 'REIMBURSEMENT',
    entityId: reimbursement.id,
    description: `Reimbursement ${reimbursement.reimbursementNo} rejected`,
    createdAt: new Date().toISOString()
  }));
};

export const cancelReimbursement = (reimbursement, currentUser) => (dispatch) => {
  dispatch(updateStatus({ id: reimbursement.id, status: 'CANCELLED', updatedFields: {} }));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: currentUser?.id,
    action: 'REIMBURSEMENT_CANCELLED',
    entityType: 'REIMBURSEMENT',
    entityId: reimbursement.id,
    description: `Reimbursement ${reimbursement.reimbursementNo} cancelled`,
    createdAt: new Date().toISOString()
  }));
};

export const markReimbursementPaid = (reimbursement, paymentDetails, currentUser) => (dispatch) => {
  const updatedFields = {
    paidAt: paymentDetails.paidAt || new Date().toISOString(),
    paidBy: currentUser?.id,
    paymentMethod: paymentDetails.paymentMethod,
    paymentReference: paymentDetails.paymentReference
  };

  dispatch(updateStatus({ id: reimbursement.id, status: 'PAID', updatedFields }));

  dispatch(logAction({
    id: `log-${uuidv4()}`,
    userId: currentUser?.id,
    action: 'REIMBURSEMENT_PAID',
    entityType: 'REIMBURSEMENT',
    entityId: reimbursement.id,
    description: `Reimbursement ${reimbursement.reimbursementNo} paid via ${paymentDetails.paymentMethod}`,
    createdAt: new Date().toISOString()
  }));

  dispatch(addNotification({
    id: `notif-${uuidv4()}`,
    title: 'Reimbursement Paid',
    message: `Reimbursement ${reimbursement.reimbursementNo} paid — ${formatCurrency(reimbursement.amount)}`,
    type: 'SUCCESS',
    createdAt: new Date().toISOString(),
    isRead: false
  }));
};
