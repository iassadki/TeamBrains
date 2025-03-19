import React, { useState, useRef, useEffect } from 'react';

const SortBy = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const options = [
        { value: 'newest', label: 'Le plus récent' },
        { value: 'oldest', label: 'Le plus ancien' }
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div className="flex items-center relative" ref={dropdownRef}>
            <label className="mr-1 text-gray-700">Trier par</label>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="border rounded-lg p-1 text-gray-700 hover:border-green-tb focus:border-green-tb focus:outline-none transition-colors bg-white"
                >
                    {options.find(opt => opt.value === value)?.label}
                </button>
                {isOpen && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow-lg z-10">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                className="px-4 py-2 cursor-pointer hover:bg-green-50 text-gray-700 hover:text-green-tb transition-colors"
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SortBy; 