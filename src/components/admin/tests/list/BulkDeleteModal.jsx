import React from 'react';
import RefinedDeleteModal from '@/components/admin/shared/RefinedDeleteModal';

const BulkDeleteModal = ({ count, isOpen, onClose, onConfirm }) => {
  if (count === 0) return null;

  return (
    <RefinedDeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Multiple Tests"
      description={`Are you sure you want to delete ${count} test${count > 1 ? 's' : ''}? This action cannot be undone and will delete all associated questions and student data for each test.`}
      itemIdentifier={`${count} test${count > 1 ? 's' : ''} selected for deletion`}
      confirmText="DELETE"
      data-oid="el3qwer"
    />
  );
};

export default BulkDeleteModal;
