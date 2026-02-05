
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useDoc, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { FullScreenAd } from '@/components/ui/full-screen-ad';
import { Loader2, RefreshCw, Coins, Check, CheckCircle2, XCircle } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';


// --- CAPTCHA Types and Generators ---

type CaptchaType = 'text' | 'math' | 'image';

interface TextCaptcha {
  type: 'text';
  text: string;
}

interface MathCaptcha {
  type: 'math';
  question: string;
  answer: number;
}

const IMAGE_CATEGORIES = {
    car: ['car', 'auto', 'sedan', 'suv'],
    bicycle: ['bicycle', 'bike', 'cyclist', 'biking'],
    boat: ['boat', 'ship', 'yacht', 'sail'],
    mountain: ['mountain', 'peak', 'range', 'alps'],
    beach: ['beach', 'coast', 'shore', 'sand'],
    flower: ['flower', 'bloom', 'petal', 'floral'],
};

type ImageCategory = keyof typeof IMAGE_CATEGORIES;

interface ImageCaptcha {
  type: 'image';
  prompt: ImageCategory;
  images: {
    src: string;
    key: string;
  }[];
  correctIndices: number[];
}

type CaptchaChallenge = TextCaptcha | MathCaptcha | ImageCaptcha;

function generateTextCaptcha(length = 6): TextCaptcha {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let captchaText = '';
  for (let i = 0; i < length; i++) {
    captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return { type: 'text', text: captchaText };
}

function generateMathCaptcha(): MathCaptcha {
    const operators = ['+', '-', '×'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let num1 = Math.floor(Math.random() * 10) + 1;
    let num2 = Math.floor(Math.random() * 10) + 1;
    let question = '';
    let answer = 0;

    switch (operator) {
        case '+':
            answer = num1 + num2;
            question = `${num1} + ${num2} = ?`;
            break;
        case '-':
            if (num1 < num2) {
                [num1, num2] = [num2, num1];
            }
            answer = num1 - num2;
            question = `${num1} - ${num2} = ?`;
            break;
        case '×':
            num1 = Math.floor(Math.random() * 8) + 2;
            num2 = Math.floor(Math.random() * 8) + 2;
            answer = num1 * num2;
            question = `${num1} × ${num2} = ?`;
            break;
    }
    return { type: 'math', question, answer };
}

function generateImageCaptcha(): ImageCaptcha {
    const categories = Object.keys(IMAGE_CATEGORIES) as ImageCategory[];
    const prompt = categories[Math.floor(Math.random() * categories.length)];
    const correctKeywords = IMAGE_CATEGORIES[prompt];
    
    const images = [];
    const correctIndices: number[] = [];
    const numImages = 9;
    const numCorrect = Math.floor(Math.random() * 3) + 3;

    const allIndices = Array.from({ length: numImages }, (_, i) => i);
    
    for (let i = allIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
    }

    for(let i=0; i<numCorrect; i++){
        correctIndices.push(allIndices[i]);
    }
    correctIndices.sort((a,b) => a-b);


    for (let i = 0; i < numImages; i++) {
        const isCorrect = correctIndices.includes(i);
        let seed;
        if (isCorrect) {
            seed = correctKeywords[Math.floor(Math.random() * correctKeywords.length)];
        } else {
            const otherCategories = categories.filter(c => c !== prompt);
            const randomCategory = otherCategories[Math.floor(Math.random() * otherCategories.length)];
            const randomKeywords = IMAGE_CATEGORIES[randomCategory];
            seed = randomKeywords[Math.floor(Math.random() * randomKeywords.length)];
        }
        const key = `${seed}-${i}-${Date.now()}`;
        images.push({
            src: `https://picsum.photos/seed/${key}/200/200`,
            key: key,
        });
    }

    return { type: 'image', prompt, images, correctIndices };
}

interface UserData {
    coins: number;
}

const TIMER_DURATIONS: Record<CaptchaType, number> = {
    image: 20,
    math: 10,
    text: 15,
};

export function CaptchaCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [userInput, setUserInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'correct' | 'incorrect' | null>(null);
  const [retries, setRetries] = useState(3);
  const [timer, setTimer] = useState(TIMER_DURATIONS.text);
  const [initialTimer, setInitialTimer] = useState(TIMER_DURATIONS.text);


  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc<UserData>(userDocRef);

  const generateNewChallenge = useCallback(() => {
    const captchaTypes: CaptchaType[] = ['text', 'math', 'image'];
    const randomType = captchaTypes[Math.floor(Math.random() * captchaTypes.length)];
    
    let newChallenge: CaptchaChallenge;
    switch (randomType) {
      case 'text':
        newChallenge = generateTextCaptcha();
        break;
      case 'math':
        newChallenge = generateMathCaptcha();
        break;
      case 'image':
        newChallenge = generateImageCaptcha();
        break;
    }
    const duration = TIMER_DURATIONS[newChallenge.type];
    setChallenge(newChallenge);
    setUserInput('');
    setSelectedImages([]);
    setInitialTimer(duration);
    setTimer(duration);
    setSubmissionStatus(null);
  }, []);

  useEffect(() => {
    generateNewChallenge();
  }, [generateNewChallenge]);


  const handleFailure = useCallback(() => {
    setSubmissionStatus('incorrect');
    const newRetries = retries - 1;
    setRetries(newRetries);

    setTimeout(() => {
      if (newRetries > 0) {
        generateNewChallenge();
      } else {
        toast({
          variant: 'destructive',
          title: 'Out of retries!',
          description: 'Loading a new set of challenges.',
        });
        setRetries(3); // Reset for new set
        generateNewChallenge();
      }
    }, 1500);
  }, [retries, generateNewChallenge, toast]);

  useEffect(() => {
    if (!challenge || submissionStatus) return;

    const interval = setInterval(() => {
        setTimer(prev => {
            if (prev > 1) {
                return prev - 1;
            } else {
                clearInterval(interval);
                handleFailure();
                return 0;
            }
        });
    }, 1000);

    return () => clearInterval(interval);
}, [challenge, submissionStatus, handleFailure]);


  const handleRefresh = () => {
    if (retries > 1) {
        setRetries(r => r - 1);
        generateNewChallenge();
    } else {
        toast({
            variant: 'destructive',
            title: 'Last try!',
            description: 'This is your last attempt for this challenge.',
        });
    }
  };
  
  const handleImageSelect = (index: number) => {
    setSelectedImages(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !challenge || !userDocRef || isLoading || submissionStatus) return;

    let isCorrect = false;
    switch (challenge.type) {
        case 'text':
            if (userInput.trim() === '') {
                toast({ variant: 'destructive', title: 'Empty Input', description: 'Please enter the CAPTCHA.' });
                return;
            }
            isCorrect = userInput.trim() === challenge.text;
            break;
        case 'math':
            if (userInput.trim() === '') {
                toast({ variant: 'destructive', title: 'Empty Input', description: 'Please enter your answer.' });
                return;
            }
            isCorrect = parseInt(userInput, 10) === challenge.answer;
            break;
        case 'image':
            if (selectedImages.length === 0) {
                toast({ variant: 'destructive', title: 'No images selected', description: 'Please select the matching images.' });
                return;
            }
            const sortedSelected = [...selectedImages].sort((a, b) => a - b);
            isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(challenge.correctIndices);
            break;
    }

    if (isCorrect) {
        setIsLoading(true);
        setSubmissionStatus('correct');

        updateDocumentNonBlocking(userDocRef, {
            coins: increment(25),
        });

        setTimeout(() => {
            toast({
              title: `+25 Coins!`,
              description: 'Your balance has been updated.',
              className: 'bg-primary text-primary-foreground',
            });
            setIsAdOpen(true);
            setIsLoading(false);
            setRetries(3); // Reset retries
            generateNewChallenge();
        }, 1500);
    } else {
        handleFailure();
    }
  };
  
  const handleAdClose = () => {
    setIsAdOpen(false);
  };
  
  const captchaImageUrl = useMemo(() => {
    if (!challenge || challenge.type !== 'text' || typeof window === 'undefined') return '';

    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = `hsl(${computedStyle.getPropertyValue('--primary').trim()})`;
    
    const chars = challenge.text.split('').map((char, index) => {
        const rotation = Math.random() * 20 - 10;
        const translateY = Math.random() * 6 - 3;
        const scale = Math.random() * 0.2 + 0.9;
        const xPos = 25 + index * 45;
        return `<text
          x="${xPos}"
          y="60"
          transform="rotate(${rotation} ${xPos} 60) translate(0 ${translateY}) scale(${scale})"
          font-size="45"
          font-family="Orbitron, sans-serif"
          font-weight="bold"
          fill="${primaryColor}"
          text-anchor="middle"
        >
          ${char}
        </text>`;
    }).join('');
    
    const noise = Array.from({length: 5}).map(() => {
        const x1 = Math.random() * 300;
        const y1 = Math.random() * 100;
        const x2 = Math.random() * 300;
        const y2 = Math.random() * 100;
        const opacity = Math.random() * 0.3 + 0.2;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${primaryColor}" stroke-width="1.5" opacity="${opacity}" />`;
    }).join('');

    const svg = `
      <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg" style="background-color: transparent; border-radius: 8px;">
        ${noise}
        <g>
          ${chars}
        </g>
      </svg>
    `;
    return `data:image/svg+xml;base64,${window.btoa(svg)}`;
  }, [challenge]);

  const getTimerIndicatorClass = () => {
    if (!initialTimer) return 'bg-primary';
    if (timer <= 3) {
        return 'bg-destructive';
    }
    if ((timer / initialTimer) <= 0.5) {
        return 'bg-yellow-500';
    }
    return 'bg-primary';
  };

  const renderChallenge = () => {
    if (!challenge) {
        return (
            <div className="h-[270px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    switch (challenge.type) {
        case 'text':
            return (
                <div className="space-y-4">
                    <div className="flex items-center justify-center rounded-lg bg-muted p-4">
                        {captchaImageUrl ? (
                            <Image src={captchaImageUrl} alt="CAPTCHA" width={300} height={100} className="rounded-md" />
                        ) : (
                            <div className="h-[100px] w-[300px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="text"
                            placeholder="Enter CAPTCHA here"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={isLoading}
                            required
                            autoCapitalize="off"
                            autoCorrect="off"
                            className="text-center tracking-widest font-mono"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading || retries <= 1}>
                            <RefreshCw className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            );
        case 'math':
            return (
                <div className="space-y-4">
                    <div className="flex items-center justify-center rounded-lg bg-muted p-4 h-[100px]">
                        <p className="text-4xl font-bold font-mono tracking-wider text-primary">{challenge.question}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            placeholder="Your answer"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={isLoading}
                            required
                            className="text-center tracking-widest font-mono"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading || retries <= 1}>
                            <RefreshCw className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            );
        case 'image':
            return (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-center text-lg">Select all images with a <span className="font-bold text-primary capitalize">{challenge.prompt}</span></p>
                        <Button type="button" variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading || retries <= 1}>
                            <RefreshCw className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {challenge.images.map((image, index) => (
                            <div key={image.key} className="relative cursor-pointer group" onClick={() => handleImageSelect(index)}>
                                <Image src={image.src} alt={`captcha image ${index + 1}`} width={100} height={100} className="rounded-md w-full h-auto aspect-square object-cover" />
                                <div className={cn(
                                    "absolute inset-0 rounded-md transition-all",
                                    selectedImages.includes(index)
                                        ? "bg-primary/50 border-4 border-primary"
                                        : "bg-black/20 opacity-0 group-hover:opacity-100"
                                )}>
                                    {selectedImages.includes(index) && (
                                        <div className="flex items-center justify-center h-full">
                                            <Check className="h-8 w-8 text-primary-foreground" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
    }
  };

  return (
    <>
      <Card className="overflow-hidden relative">
         {submissionStatus && (
            <div className="absolute inset-0 bg-card/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="animate-pop-in">
                    {submissionStatus === 'correct' ? (
                        <CheckCircle2 className="h-32 w-32 text-primary" />
                    ) : (
                        <XCircle className="h-32 w-32 text-destructive" />
                    )}
                </div>
            </div>
        )}
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Your Balance</CardTitle>
            <div className="flex items-center gap-2 text-lg font-bold text-primary">
              <Coins className="h-6 w-6" />
              <span>{userData?.coins?.toLocaleString() ?? 0}</span>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Progress value={(timer / initialTimer) * 100} className="h-2" indicatorClassName={getTimerIndicatorClass()} />
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>Time left: {timer}s</span>
                    <span>Retries left: {retries}</span>
                </div>
            </div>
            {renderChallenge()}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || submissionStatus !== null}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit & Earn 25 Coins
            </Button>
          </CardFooter>
        </form>
      </Card>
      <FullScreenAd open={isAdOpen} onClose={handleAdClose} />
    </>
  );
}
