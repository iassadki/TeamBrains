import React from 'react';

const Checkbox = ({ label, checked, onChange }) => {
    return (
        <label className="flex items-center cursor-pointer mb-2 group">
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={onChange}
                />
                <div className={`
                    w-5 h-5 border-2 rounded 
                    transition-colors duration-200
                    ${checked ? 'bg-green-tb border-green-tb' : 'border-gray-300 group-hover:border-green-tb'}
                `}>
                    {checked && (
                        <svg
                            className="w-4 h-4 text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
            </div>
            <span className="ml-2 text-gray-700">{label}</span>
        </label>
    );
};

export default Checkbox; 