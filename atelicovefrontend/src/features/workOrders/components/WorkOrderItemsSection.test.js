import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import WorkOrderItemsSection from './WorkOrderItemsSection';

test('preserves saved-item actions and draft-item controls', () => {
  const item = {
    workOrderItemID: 5,
    itemType: 'LABOR',
    itemName: 'Install',
    quantity: 2,
    price: 50,
  };
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onAdd = jest.fn();
  const onSave = jest.fn();

  render(
    <WorkOrderItemsSection
      savedItems={[item]}
      editItems={[]}
      total={100}
      saving={false}
      getItemID={value => value.workOrderItemID}
      onEdit={onEdit}
      onDelete={onDelete}
      onFieldChange={jest.fn()}
      onRemoveEdit={jest.fn()}
      onAdd={onAdd}
      onSave={onSave}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add Item' }));

  expect(onEdit).toHaveBeenCalledWith(item);
  expect(onDelete).toHaveBeenCalledWith(item);
  expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
    itemType: 'LABOR',
    quantity: 1,
    price: 0,
    isNew: true,
  }));
  expect(screen.getByRole('button', { name: 'Save Items' }).disabled).toBe(true);
});
