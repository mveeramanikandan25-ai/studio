'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useDoc, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Coins, CheckCircle2, XCircle, Apple, Banana, Car, Plane, Dog, Cat, Heart, Star, Cloud, Sun, Moon, Rocket, Home, Key, Ghost, Bomb, Bug, Anchor, Bike, RotateCcw, Play, Volume2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import dynamic from 'next/dynamic';
import { Slider } from '@/components/ui/slider';


const FullScreenAd = dynamic(() => import('@/components/ui/full-screen-ad').then(mod => mod.FullScreenAd), { ssr: false });


// --- CAPTCHA Types and Generators ---

type CaptchaType = 'text' | 'math' | 'icon-sequence' | 'audio' | 'puzzle' | 'color';

interface TextCaptcha {
  type: 'text';
  text: string;
}

interface MathCaptcha {
  type: 'math';
  question: string;
  answer: number;
}

// --- Icon CAPTCHA Types and Generators ---
type IconComponent = React.ComponentType<{ className?: string }>;

interface IconInfo {
  id: string;
  Icon: IconComponent;
}

const ALL_ICONS: IconInfo[] = [
  { id: 'apple', Icon: Apple }, { id: 'banana', Icon: Banana }, { id: 'car', Icon: Car },
  { id: 'plane', Icon: Plane }, { id: 'dog', Icon: Dog }, { id: 'cat', Icon: Cat },
  { id: 'heart', Icon: Heart }, { id: 'star', Icon: Star }, { id: 'cloud', Icon: Cloud },
  { id: 'sun', Icon: Sun }, { id: 'moon', Icon: Moon }, { id: 'rocket', Icon: Rocket },
  { id: 'home', Icon: Home }, { id: 'key', Icon: Key }, { id: 'ghost', Icon: Ghost },
  { id: 'bomb', Icon: Bomb }, { id: 'bug', Icon: Bug }, { id: 'anchor', Icon: Anchor }, { id: 'bike', Icon: Bike },
];


interface PositionedIcon extends IconInfo {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

interface IconSequenceCaptcha {
  type: 'icon-sequence';
  sequence: IconInfo[];
  options: PositionedIcon[];
}

interface AudioCaptcha {
  type: 'audio';
  text: string;
}

interface PuzzleCaptcha {
  type: 'puzzle';
  imageUrl: string;
  targetX: number; // Percentage from left (20-80)
  pieceY: number;  // Percentage from top
}

interface ColorInfo {
    name: string;
    hex: string;
}

interface ColorCaptcha {
    type: 'color';
    target: ColorInfo;
    options: ColorInfo[];
}


type CaptchaChallenge = TextCaptcha | MathCaptcha | IconSequenceCaptcha | AudioCaptcha | PuzzleCaptcha | ColorCaptcha;

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

function generateIconSequenceCaptcha(): IconSequenceCaptcha {
  const shuffledIcons = [...ALL_ICONS].sort(() => 0.5 - Math.random());

  const sequenceLength = Math.floor(Math.random() * 2) + 3; // 3 or 4 icons in sequence
  const sequence = shuffledIcons.slice(0, sequenceLength);

  const numDistractors = Math.floor(Math.random() * 3) + 4; // 4 to 6 distractors
  const distractors = shuffledIcons.slice(sequenceLength, sequenceLength + numDistractors);

  const allOptions = [...sequence, ...distractors].sort(() => 0.5 - Math.random());

  const options: PositionedIcon[] = allOptions.map(icon => ({
    ...icon,
    x: Math.random() * 85 + 7.5, // % position
    y: Math.random() * 85 + 7.5,
    rotation: Math.random() * 90 - 45,
    scale: Math.random() * 0.3 + 0.9, // 0.9 to 1.2
  }));

  // Basic collision detection to spread icons out
  for (let i = 0; i < options.length; i++) {
    for (let j = i + 1; j < options.length; j++) {
      const dist = Math.hypot(options[i].x - options[j].x, options[i].y - options[j].y);
      if (dist < 18) { // Minimum 18% distance between centers
        options[j].x = Math.random() * 85 + 7.5;
        options[j].y = Math.random() * 85 + 7.5;
        i = 0; // Restart check
        j = options.length; // Break inner loop
      }
    }
  }

  return {
    type: 'icon-sequence',
    sequence,
    options,
  };
}

function generateAudioCaptcha(): AudioCaptcha {
  const chars = '0123456789'; // Only numbers
  let text = '';
  const length = Math.floor(Math.random() * 3) + 4; // 4 to 6 digits for clarity
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return { type: 'audio', text };
}

function generatePuzzleCaptcha(): PuzzleCaptcha {
    const seed = Math.floor(Math.random() * 1000);
    return {
        type: 'puzzle',
        imageUrl: `https://picsum.photos/seed/puzzle${seed}/400/200`,
        targetX: Math.floor(Math.random() * 50) + 25, // 25% to 74%
        pieceY: Math.floor(Math.random() * 50) + 25, // 25% to 74%
    };
}

const ALL_COLORS: ColorInfo[] = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Yellow', hex: '#eab308' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Cyan', hex: '#06b6d4' },
];

function generateColorCaptcha(): ColorCaptcha {
    const shuffled = [...ALL_COLORS].sort(() => 0.5 - Math.random());
    const target = shuffled[0];
    const options = shuffled.slice(0, 6).sort(() => 0.5 - Math.random()); // Take 6 colors
    return {
        type: 'color',
        target,
        options,
    };
}


interface UserData {
    coins: number;
}

const TIMER_DURATIONS: Record<CaptchaType, number> = {
    math: 10,
    text: 15,
    'icon-sequence': 20,
    'audio': 20,
    'puzzle': 25,
    'color': 15,
};

export function CaptchaCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [userInput, setUserInput] = useState('');
  const [selectedIcons, setSelectedIcons] = useState<PositionedIcon[]>([]);
  const [puzzleSliderValue, setPuzzleSliderValue] = useState([10]);
  const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(null);
  const [replaysLeft, setReplaysLeft] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'correct' | 'incorrect' | null>(null);
  const [retries, setRetries] = useState(3);
  const [timer, setTimer] = useState(TIMER_DURATIONS.text);
  const [initialTimer, setInitialTimer] = useState(TIMER_DURATIONS.text);
  const hasAudioPlayed = useRef(false);


  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc<UserData>(userDocRef);

  const generateNewChallenge = useCallback((resetStatus = true) => {
    const captchaTypes: CaptchaType[] = ['text', 'math', 'icon-sequence', 'audio', 'puzzle', 'color'];
    const randomType = captchaTypes[Math.floor(Math.random() * captchaTypes.length)];
    
    let newChallenge: CaptchaChallenge;
    switch (randomType) {
      case 'text':
        newChallenge = generateTextCaptcha();
        break;
      case 'math':
        newChallenge = generateMathCaptcha();
        break;
      case 'icon-sequence':
        newChallenge = generateIconSequenceCaptcha();
        break;
      case 'audio':
        newChallenge = generateAudioCaptcha();
        break;
      case 'puzzle':
        newChallenge = generatePuzzleCaptcha();
        break;
      case 'color':
        newChallenge = generateColorCaptcha();
        break;
    }
    const duration = TIMER_DURATIONS[newChallenge.type];
    setChallenge(newChallenge);
    setUserInput('');
    setSelectedIcons([]);
    setPuzzleSliderValue([10]);
    setSelectedColor(null);
    hasAudioPlayed.current = false;
    setReplaysLeft(2);
    setInitialTimer(duration);
    setTimer(duration);
    if (resetStatus) {
      setSubmissionStatus(null);
    }
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
  
  const handleIconClick = (icon: PositionedIcon) => {
      if (isLoading || submissionStatus) return;
      
      if (challenge?.type === 'icon-sequence' && selectedIcons.length >= challenge.sequence.length) {
          return;
      }
      setSelectedIcons(prev => [...prev, icon]);
  };

  const handleReplayAudio = () => {
    if (challenge?.type === 'audio' && 'speechSynthesis' in window) {
      if (hasAudioPlayed.current && replaysLeft <= 0) return;

      const spokenText = challenge.text.split('').join(' ');
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = 'en-US';
      utterance.rate = 0.7; // Slower speech rate
      window.speechSynthesis.speak(utterance);

      if (hasAudioPlayed.current) {
        setReplaysLeft(r => r - 1);
      } else {
        hasAudioPlayed.current = true;
      }
    }
  };


  const handleSubmit = async () => {
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
        case 'icon-sequence': {
            if (selectedIcons.length !== challenge.sequence.length) {
                isCorrect = false;
            } else {
                isCorrect = selectedIcons.every((icon, index) => icon.id === challenge.sequence[index].id);
            }
            break;
        }
        case 'audio': {
            if (userInput.trim() === '') {
                toast({ variant: 'destructive', title: 'Empty Input', description: 'Please enter what you heard.' });
                return;
            }
            isCorrect = userInput.trim().toUpperCase() === challenge.text.toUpperCase();
            break;
        }
        case 'puzzle': {
            const sliderVal = puzzleSliderValue[0];
            // Allow a small tolerance
            isCorrect = Math.abs(sliderVal - challenge.targetX) < 2;
            break;
        }
        case 'color': {
            if (!selectedColor) {
                toast({ variant: 'destructive', title: 'No Selection', description: 'Please select a color.' });
                return;
            }
            isCorrect = selectedColor.hex === challenge.target.hex;
            break;
        }
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
            setReplaysLeft(2);
            generateNewChallenge(false);
        }, 1500);
    } else {
        handleFailure();
    }
  };
  
  const handleAdClose = () => {
    setIsAdOpen(false);
    setSubmissionStatus(null);
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
                            disabled={isLoading || submissionStatus !== null}
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
                            disabled={isLoading || submissionStatus !== null}
                            required
                            className="text-center tracking-widest font-mono"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading || retries <= 1}>
                            <RefreshCw className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            );
        case 'icon-sequence':
            return (
                <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-muted p-2">
                        <p className="text-sm font-medium">Select in this order:</p>
                        <div className="flex items-center gap-2">
                            {challenge.sequence.map(({ Icon, id }, index) => (
                                <div key={`${id}-${index}`} className="p-1 bg-background/50 rounded-md shadow-inner">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative w-full h-64 bg-muted/30 rounded-lg overflow-hidden border">
                         <Image src="https://picsum.photos/seed/space/400/300" layout="fill" objectFit="cover" alt="Challenge background" className="opacity-20 blur-[2px]" />
                        {challenge.options.map((icon, index) => {
                            const { Icon, id, x, y, rotation, scale } = icon;
                            const selectionIndex = selectedIcons.findIndex(i => i === icon);
                            const isSelected = selectionIndex !== -1;

                            return (
                                <div
                                    key={`${id}-${index}`}
                                    className={cn(
                                        "absolute flex items-center justify-center p-2 rounded-lg bg-card/80 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:scale-110 hover:!opacity-100",
                                        isSelected ? "ring-2 ring-primary opacity-100" : "opacity-80"
                                    )}
                                    style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
                                    }}
                                    onClick={() => handleIconClick(icon)}
                                >
                                    <Icon className="h-8 w-8 text-foreground" />
                                    {isSelected && (
                                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground h-5 w-5 text-xs rounded-full flex items-center justify-center font-bold animate-pop-in">
                                            {selectionIndex + 1}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                     <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" className="w-full" onClick={() => setSelectedIcons([])} disabled={isLoading || submissionStatus !== null || selectedIcons.length === 0}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Clear Selection
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading || retries <= 1}>
                            <RefreshCw className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            );
        case 'audio':
            return (
                <div className="space-y-4">
                    <div className="rounded-lg bg-muted p-4 h-[100px] flex items-center justify-center gap-4">
                       <p className="text-center text-muted-foreground">Press the button and type what you hear.</p>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <Button size="icon" variant="ghost" className="h-20 w-20" onClick={handleReplayAudio} disabled={hasAudioPlayed.current && replaysLeft <= 0}>
                            <Play className="h-10 w-10 text-primary" />
                        </Button>
                        <div className="flex flex-col items-center">
                            <Volume2 className="h-6 w-6 text-primary" />
                            <span className="text-xs text-muted-foreground">{replaysLeft} replays left</span>
                        </div>
                    </div>
                    <Input
                        type="text"
                        placeholder="Type what you hear"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={isLoading || submissionStatus !== null}
                        required
                        autoCapitalize="off"
                        autoCorrect="off"
                        className="text-center tracking-widest font-mono"
                    />
                </div>
            );
        case 'puzzle':
            return (
                <div className="space-y-4">
                    <p className="text-center text-muted-foreground">Slide the piece to fit in the hole.</p>
                    <div className="relative w-full h-[200px] bg-muted rounded-lg overflow-hidden border">
                        <Image
                            src={challenge.imageUrl}
                            layout="fill"
                            objectFit="cover"
                            alt="Puzzle background"
                            className="opacity-50"
                        />
                        {/* The hole */}
                        <div
                            className="absolute text-black/30"
                            style={{
                                left: `${challenge.targetX}%`,
                                top: `${challenge.pieceY}%`,
                                transform: `translate(-50%, -50%)`,
                            }}
                        >
                            <Ghost className="w-12 h-12" />
                        </div>
                        {/* The draggable piece */}
                        <div
                            className="absolute text-primary drop-shadow-lg cursor-grab active:cursor-grabbing"
                            style={{
                                left: `${puzzleSliderValue[0]}%`,
                                top: `${challenge.pieceY}%`,
                                transform: `translate(-50%, -50%)`,
                                transition: 'left 100ms ease-out',
                            }}
                        >
                           <Ghost className="w-12 h-12" />
                        </div>
                    </div>
                    <div className="pt-2">
                        <Slider
                            value={puzzleSliderValue}
                            onValueChange={setPuzzleSliderValue}
                            max={95}
                            min={5}
                            step={0.1}
                            disabled={isLoading || submissionStatus !== null}
                        />
                    </div>
                </div>
            );
        case 'color':
            return (
                <div className="space-y-4">
                    <p className="text-center font-semibold">
                        Tap the color: <span className="font-bold" style={{ color: challenge.target.hex }}>{challenge.target.name}</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2 h-48">
                        {challenge.options.map((color, index) => (
                            <div
                                key={index}
                                onClick={() => setSelectedColor(color)}
                                className={cn(
                                    "w-full h-full rounded-lg cursor-pointer transition-all flex items-center justify-center",
                                    selectedColor?.hex === color.hex && 'ring-2 ring-primary'
                                )}
                                style={{ backgroundColor: color.hex }}
                            >
                                {selectedColor?.hex === color.hex && (
                                    <CheckCircle2 className="h-8 w-8 text-white" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
    }
  };

  const getSubmitButtonText = () => {
    if (challenge?.type === 'icon-sequence') {
      return 'Check Sequence & Earn 25 Coins';
    }
    if (challenge?.type === 'puzzle') {
      return 'Check Position & Earn 25 Coins';
    }
    return 'Submit & Earn 25 Coins';
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
            <Button onClick={handleSubmit} className="w-full" disabled={isLoading || submissionStatus !== null}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getSubmitButtonText()}
            </Button>
          </CardFooter>
        
      </Card>
      {isAdOpen && <FullScreenAd open={isAdOpen} onClose={handleAdClose} />}
    </>
  );
}
