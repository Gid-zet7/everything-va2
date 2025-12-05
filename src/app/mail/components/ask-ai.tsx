'use client'
import { useChat } from 'ai/react'
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button'
import { AnimatePresence } from 'framer-motion';
import React from 'react'
import { Send } from 'lucide-react';
import { useLocalStorage } from 'usehooks-ts';
import { cn } from '@/lib/utils';
import { SparklesIcon } from '@heroicons/react/24/solid';
import StripeButton from './stripe-button';
import PremiumBanner from './premium-banner';
import { toast } from 'sonner';


const transitionDebug = {
    type: "easeOut",
    duration: 0.2,
};
const AskAI = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const [accountId] = useLocalStorage('accountId', '')
    const { input, handleInputChange, handleSubmit, messages, isLoading, error } = useChat({
        api: "/api/chat",
        body: {
            accountId,
        },
        onError: (error) => {
            console.error("Chat error:", error);
            
            if (error.message.includes('Limit reached')) {
                toast.error('You have reached the limit for today. Please upgrade to pro to ask as many questions as you want');
            } else if (error.message.includes('Account not found') || error.message.includes('account')) {
                toast.error('Please select a valid email account first');
            } else if (error.message.includes('required') || error.message.includes('Invalid')) {
                toast.error('Invalid request. Please try again.');
            } else if (error.message.includes('unavailable') || error.message.includes('service')) {
                toast.error('AI service is temporarily unavailable. Please try again later.');
            } else if (error.message.includes('Unauthorized')) {
                toast.error('You are not authorized. Please log in again.');
            } else {
                toast.error(`Unable to process your question: ${error.message || 'Unknown error'}`);
            }
        },
        initialMessages: [],
    });
    React.useEffect(() => {
        const messageContainer = document.getElementById("message-container");
        if (messageContainer) {
            messageContainer.scrollTo({
                top: messageContainer.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountId) {
            toast.error('Please select an email account first');
            return;
        }
        if (!input.trim()) {
            return;
        }
        handleSubmit(e);
    };

    if (isCollapsed) return null;
    return (
        <div className='p-4 mb-14'>

            <PremiumBanner />
            <div className="h-4"></div>
            <motion.div className="flex flex-1 flex-col items-end justify-end pb-4 border p-4 rounded-lg bg-gray-100 shadow-inner dark:bg-gray-900">
                <div className="max-h-[50vh] overflow-y-scroll w-full flex flex-col gap-2" id='message-container'>
                    <AnimatePresence mode="wait">
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                layout="position"
                                className={cn("z-10 mt-2 max-w-[250px] break-words rounded-2xl bg-gray-200 dark:bg-gray-800", {
                                    'self-end text-gray-900 dark:text-gray-100': message.role === 'user',
                                    'self-start bg-blue-500 text-white': message.role === 'assistant',
                                })}
                                layoutId={`container-[${messages.length - 1}]`}
                                transition={transitionDebug}
                            >
                                <div className="px-3 py-2 text-[15px] leading-[15px]">
                                    {message.content}
                                </div>
                            </motion.div>
                        ))}
                        {isLoading && (
                            <motion.div
                                layout="position"
                                className="self-start bg-blue-500 text-white z-10 mt-2 max-w-[250px] break-words rounded-2xl"
                                transition={transitionDebug}
                            >
                                <div className="px-3 py-2 text-[15px] leading-[15px]">
                                    Thinking...
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {messages.length > 0 && <div className="h-4"></div>}
                <div className="w-full">
                    {messages.length === 0 && !error && (
                        <div className="mb-4">
                            {!accountId ? (
                                <div className='flex items-center gap-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
                                    <SparklesIcon className='size-6 text-yellow-600 dark:text-yellow-400' />
                                    <div>
                                        <p className='text-gray-900 dark:text-gray-100 text-sm font-medium'>Select an email account</p>
                                        <p className='text-gray-500 text-xs dark:text-gray-400'>Please select an email account to ask questions about your emails</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className='flex items-center gap-4'>
                                        <SparklesIcon className='size-6 text-gray-500' />
                                        <div>
                                            <p className='text-gray-900 dark:text-gray-100'>Ask AI anything about your emails</p>
                                            <p className='text-gray-500 text-xs dark:text-gray-400'>Get answers to your questions about your emails</p>
                                        </div>
                                    </div>
                                    <div className="h-2"></div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span onClick={() => handleInputChange({
                                            target: {
                                                value: 'What can I ask?'
                                            }
                                        })} className='px-2 py-1 bg-gray-800 text-gray-200 rounded-md text-xs cursor-pointer hover:bg-gray-700'>What can I ask?</span>
                                        <span onClick={() => handleInputChange({
                                            target: {
                                                value: 'When is my next flight?'
                                            }
                                        })} className='px-2 py-1 bg-gray-800 text-gray-200 rounded-md text-xs cursor-pointer hover:bg-gray-700'>When is my next flight?</span>
                                        <span onClick={() => handleInputChange({
                                            target: {
                                                value: 'When is my next meeting?'
                                            }
                                        })} className='px-2 py-1 bg-gray-800 text-gray-200 rounded-md text-xs cursor-pointer hover:bg-gray-700'>When is my next meeting?</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <form onSubmit={handleFormSubmit} className="flex w-full">
                        <input
                            type="text"
                            onChange={handleInputChange}
                            value={input}
                            className="py- relative h-9 placeholder:text-[13px] flex-grow rounded-full border border-gray-200 bg-white px-3 text-[15px] outline-none placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-blue-500/20 focus-visible:ring-offset-1
            dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus-visible:ring-blue-500/20 dark:focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-700
            "
                            placeholder="Ask AI anything about your emails"
                        />
                        <motion.div
                            key={messages.length}
                            layout="position"
                            className="pointer-events-none absolute z-10 flex h-9 w-[250px] items-center overflow-hidden break-words rounded-full bg-gray-200 [word-break:break-word] dark:bg-gray-800"
                            layoutId={`container-[${messages.length}]`}
                            transition={transitionDebug}
                            initial={{ opacity: 0.6, zIndex: -1 }}
                            animate={{ opacity: 0.6, zIndex: -1 }}
                            exit={{ opacity: 1, zIndex: 1 }}
                        >
                            <div className="px-3 py-2 text-[15px] leading-[15px] text-gray-900 dark:text-gray-100">
                                {input}
                            </div>
                        </motion.div>
                        <button
                            type="submit"
                            disabled={!accountId || isLoading || !input.trim()}
                            className={cn(
                                "ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800",
                                (!accountId || isLoading || !input.trim()) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Send className={cn("size-4 text-gray-500 dark:text-gray-300", isLoading && "animate-pulse")} />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}

export default AskAI