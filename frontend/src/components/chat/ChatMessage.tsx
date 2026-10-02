import React from 'react';
import { MessageItem } from '../../types';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';

interface Props {
  message: MessageItem;
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  if (message.role === 'user') {
    return <UserMessage message={message} />;
  }
  return <AssistantMessage message={message} />;
};
