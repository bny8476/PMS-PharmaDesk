import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function AppModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = 'sm:max-w-lg',
  size = null
}) {
  const sizeClasses = {
    'sm': 'sm:max-w-sm',
    'md': 'sm:max-w-md',
    'lg': 'sm:max-w-lg',
    'xl': 'sm:max-w-5xl',
    '2xl': 'sm:max-w-7xl',
    'full': 'sm:max-w-[95vw]'
  };

  const finalMaxWidth = size ? sizeClasses[size] : maxWidth;
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className={cn(
                "relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full",
                finalMaxWidth
              )}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
                  <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-all"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Content */}
                <div className="bg-white px-6 py-6">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

AppModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  maxWidth: PropTypes.string,
  size: PropTypes.string
};
