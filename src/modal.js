import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start justify-start z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg relative m-4">
        <button className="absolute top-0 right-0 mr-4" style={{fontSize: '40px', color: 'black'}} onClick={onClose}>
          &times;
        </button>
        <div className='mb-10'></div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
