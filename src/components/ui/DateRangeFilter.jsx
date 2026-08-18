import React from 'react';
import { Select } from './Select';
import { Input } from './Input';
import { cn } from '../../utils/cn';

export function DateRangeFilter({ value, onChange, className }) {
  // value is an object { preset: 'TODAY'|'YESTERDAY'|'THIS_WEEK'|'THIS_MONTH'|'CUSTOM', from: '', to: '' }

  const handlePresetChange = (e) => {
    const preset = e.target.value;
    const now = new Date();
    let from = '';
    let to = '';

    if (preset === 'TODAY') {
      from = now.toISOString().split('T')[0];
      to = from;
    } else if (preset === 'YESTERDAY') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      from = yesterday.toISOString().split('T')[0];
      to = from;
    } else if (preset === 'THIS_WEEK') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start
      from = startOfWeek.toISOString().split('T')[0];
      to = now.toISOString().split('T')[0];
    } else if (preset === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      from = startOfMonth.toISOString().split('T')[0];
      to = now.toISOString().split('T')[0];
    } else if (preset === 'CUSTOM') {
      from = value.from || now.toISOString().split('T')[0];
      to = value.to || now.toISOString().split('T')[0];
    }

    onChange({ preset, from, to });
  };

  const handleDateChange = (field, dateVal) => {
    onChange({ ...value, preset: 'CUSTOM', [field]: dateVal });
  };

  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      <Select
        value={value.preset || 'TODAY'}
        onChange={handlePresetChange}
        options={[
          { value: 'TODAY', label: 'Today' },
          { value: 'YESTERDAY', label: 'Yesterday' },
          { value: 'THIS_WEEK', label: 'This Week' },
          { value: 'THIS_MONTH', label: 'This Month' },
          { value: 'ALL', label: 'All Time' },
          { value: 'CUSTOM', label: 'Custom Range' },
        ]}
      />
      {value.preset === 'CUSTOM' && (
        <>
          <Input 
            type="date" 
            label="Date From" 
            value={value.from || ''} 
            onChange={(e) => handleDateChange('from', e.target.value)} 
          />
          <Input 
            type="date" 
            label="Date To" 
            value={value.to || ''} 
            onChange={(e) => handleDateChange('to', e.target.value)} 
          />
        </>
      )}
    </div>
  );
}
