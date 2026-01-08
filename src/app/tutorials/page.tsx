import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function TutorialsPage() {
    const faqItems = [
        {
            question: "What is a trading bot?",
            answer: "A trading bot is an automated program that executes buy and sell orders on your behalf based on a pre-defined strategy. It can help remove emotion from trading and operate 24/7."
        },
        {
            question: "How do I create my first bot strategy?",
            answer: "Navigate to the Bot Builder page. You can either use one of our Quick Start strategies or describe your own in the 'Describe Your Strategy' text area. For example, 'Buy when the price is low, sell when it's high'."
        },
        {
            question: "What is backtesting?",
            answer: "Backtesting is the process of simulating a trading strategy on historical data to see how it would have performed. Our AI-assisted backtesting provides insights and projections to help you refine your strategy before deploying it with real money."
        },
        {
            question: "Is using a trading bot risky?",
            answer: "All trading involves risk. While bots can automate strategies, they are only as good as the logic they are given. It's crucial to thoroughly backtest your strategies and never risk more than you are willing to lose."
        },
        {
            question: "How does the AI analysis work?",
            answer: "Our AI model takes your natural language strategy and simulates it against a set of historical market data. It then generates a projection of potential performance and offers actionable insights to improve your strategy's effectiveness."
        }
    ]

    return (
        <div className="container py-8 max-w-4xl mx-auto">
            <Card>
                <CardHeader className="text-center">
                    <div className="mx-auto bg-secondary rounded-full p-3 w-fit mb-4">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="font-headline text-3xl">Tutorials & FAQs</CardTitle>
                    <CardDescription>
                        Your guide to building, testing, and deploying trading bots on Deriv.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {faqItems.map((item, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger className="font-headline text-lg">{item.question}</AccordionTrigger>
                                <AccordionContent className="text-base text-muted-foreground">
                                    {item.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
