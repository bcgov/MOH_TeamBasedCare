interface DropdownOptionProps {
  id: string;
  value: string;
}

interface DropdownProps {
  label: string;
  options: DropdownOptionProps[];
  id: string;
  defaultValue?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ label, options, id, defaultValue }) => {
  return (
    <div>
      <legend className='font-bold mb-4'>{label}</legend>
      <select
        defaultValue={defaultValue}
        id={id}
        className='bg-gray-100 border-b-2 border-gray-900 text-gray-900 text-sm rounded-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
      >
        {options
          ? options.map((option: DropdownOptionProps) => {
              return (
                <option key={option.id} value={option.value}>
                  {option.value}
                </option>
              );
            })
          : null}
      </select>
    </div>
  );
};
