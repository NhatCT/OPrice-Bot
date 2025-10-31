// @ts-nocheck
export class FeedbackDto {
    messageId: number;
    feedback: 'positive' | 'negative';
    comment?: string;
}
