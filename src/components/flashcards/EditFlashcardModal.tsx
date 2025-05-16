import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { FlashcardDto, CreateFlashcardInputDto } from '@/types';

const formSchema = z.object({
  front: z
    .string()
    .min(1, 'Front content is required')
    .max(200, 'Front content must be at most 200 characters'),
  back: z
    .string()
    .min(1, 'Back content is required')
    .max(600, 'Back content must be at most 600 characters'),
});

type FormData = z.infer<typeof formSchema>;

interface EditFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcard?: FlashcardDto;
  onSubmit: (data: CreateFlashcardInputDto) => Promise<void>;
  isLoading: boolean;
}

export function EditFlashcardModal({
  isOpen,
  onClose,
  flashcard,
  onSubmit,
  isLoading,
}: EditFlashcardModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      front: '',
      back: '',
    },
  });

  useEffect(() => {
    if (flashcard) {
      form.reset({
        front: flashcard.front,
        back: flashcard.back,
      });
    } else {
      form.reset({
        front: '',
        back: '',
      });
    }
  }, [flashcard, form]);

  const handleSubmit = async (data: FormData) => {
    try {
      await onSubmit({
        ...data,
        source: 'manual',
        generation_id: null,
      });
      form.reset();
    } catch (error) {
      // Error handling is managed by the parent component
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle>{flashcard ? 'Edit Flashcard' : 'Create New Flashcard'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="front"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Front</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the front content" className="h-24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="back"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Back</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the back content" className="h-32" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : flashcard ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
