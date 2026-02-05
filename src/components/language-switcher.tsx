'use client';

import { useUser, useFirestore, useDoc, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserData {
    language?: string;
}

export function LanguageSwitcher() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc<UserData>(userDocRef);

  const handleLanguageChange = (value: string) => {
    if (userDocRef) {
      updateDocumentNonBlocking(userDocRef, { language: value });
      let languageName = 'English';
      if (value === 'hi') languageName = 'Hindi';
      if (value === 'ta') languageName = 'Tamil';
      toast({ title: `Language changed to ${languageName}` });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-5 w-5 text-muted-foreground" />
      <Select
        value={userData?.language || 'en'}
        onValueChange={handleLanguageChange}
        disabled={!userData}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
          <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
