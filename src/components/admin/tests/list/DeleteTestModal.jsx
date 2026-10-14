import React from 'react';
import RefinedDeleteModal from '@/components/admin/shared/RefinedDeleteModal';

const DeleteTestModal = ({ test, isOpen, onClose, onConfirm }) => {
  if (!test) return null;

  return (
    <RefinedDeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Test Module"
      description="Are you sure you want to delete this test? This action cannot be undone and will delete all associated questions and student data."
      itemIdentifier={test.title}
      confirmText={test.title || test.id}
      confirmationKey={test.id}
      data-oid="4z9k3h7"
    />
  );
};

export default DeleteTestModal;
