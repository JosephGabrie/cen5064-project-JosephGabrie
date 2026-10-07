'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray, Control, UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const questionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  answer: z.string().optional(),
  points: z.number().min(1, 'Points must be at least 1'),
  type: z.enum(['multiple_choice', 'free_form', 'fill_in_the_blank', 'true_false']),
  options: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.type !== 'free_form' && (!data.answer || data.answer.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Answer is required',
      path: ['answer'],
    });
  }
});

const formSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  dueDate: z.string().min(1, 'Due Date is required'),
  assignmentType: z.enum(['question', 'file']),
  fileUrl: z.string().optional(),
  questions: z.array(questionSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Sub-component to handle nested field array for options
function QuestionItem({
  index,
  control,
  register,
  watch,
  remove,
  errors
}: {
  index: number;
  control: Control<FormValues>;
  register: UseFormRegister<FormValues>;
  watch: UseFormWatch<FormValues>;
  remove: (index: number) => void;
  errors: FieldErrors<FormValues>;
}) {
  const type = watch(`questions.${index}.type`);
  
  // Manage nested options array for multiple choice
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    name: `questions.${index}.options`,
    control,
  });

  return (
    <div className="flex flex-col gap-4 p-5 border border-slate-200 rounded-lg relative bg-white dark:bg-slate-800">
      <button
        type="button"
        onClick={() => remove(index)}
        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      <div>
        <label className="text-sm font-semibold mb-2 block">Question Type</label>
        <div className="flex flex-wrap gap-2">
          {(['multiple_choice', 'free_form', 'fill_in_the_blank', 'true_false'] as const).map((t) => (
            <label key={t} className="flex items-center cursor-pointer border border-slate-200 px-4 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/30 has-[:checked]:border-blue-300 dark:has-[:checked]:border-blue-700">
              <input
                type="radio"
                value={t}
                {...register(`questions.${index}.type`)}
                className="sr-only"
              />
              <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-200">{t.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold mb-1 block">Question Text</label>
        <Input placeholder="Enter your question here..." {...register(`questions.${index}.question`)} />
        {errors.questions?.[index]?.question && <p className="text-red-500 text-xs mt-1">{errors.questions[index].question.message}</p>}
      </div>

      {type !== 'free_form' && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
          <label className="text-sm font-semibold mb-2 block">Expected Answer</label>
          
          {type === 'true_false' && (
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="true" {...register(`questions.${index}.answer`)} className="w-4 h-4 text-blue-600" /> 
                <span className="font-medium text-sm">True</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="false" {...register(`questions.${index}.answer`)} className="w-4 h-4 text-blue-600" /> 
                <span className="font-medium text-sm">False</span>
              </label>
            </div>
          )}

          {type === 'multiple_choice' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Add options below and select the correct answer.</p>
              {optionFields.map((field, optIndex) => (
                <div key={field.id} className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    value={watch(`questions.${index}.options.${optIndex}`) || ''} 
                    {...register(`questions.${index}.answer`)} 
                    className="w-4 h-4 text-blue-600 shrink-0"
                  />
                  <Input 
                    placeholder={`Option ${optIndex + 1}`} 
                    {...register(`questions.${index}.options.${optIndex}`)} 
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        appendOption('');
                      }
                    }}
                  />
                  <button type="button" onClick={() => removeOption(optIndex)} className="text-slate-400 hover:text-red-500 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => appendOption('')} className="mt-2">
                + Add Option
              </Button>
            </div>
          )}

          {type === 'fill_in_the_blank' && (
            <Input placeholder="Enter the correct answer text..." {...register(`questions.${index}.answer`)} />
          )}
          {errors.questions?.[index]?.answer && <p className="text-red-500 text-xs mt-1">{errors.questions[index].answer.message}</p>}
        </div>
      )}

      <div className="pt-2">
        <label className="text-sm font-semibold mb-1 block">Points</label>
        <Input type="number" className="w-32" placeholder="Points" {...register(`questions.${index}.points`, { valueAsNumber: true })} />
        {errors.questions?.[index]?.points && <p className="text-red-500 text-xs mt-1">{errors.questions[index].points.message}</p>}
      </div>
    </div>
  );
}

export default function CreateAssignmentForm({ classId }: { classId?: string }) {
  const [assignmentType, setAssignmentType] = useState<'question' | 'file'>('question');

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classId: classId || '',
      assignmentType: 'question',
      questions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: 'questions',
    control,
  });

  const watchAssignmentType = watch('assignmentType');

  React.useEffect(() => {
    setAssignmentType(watchAssignmentType);
  }, [watchAssignmentType]);

  const onSubmit = async (data: FormValues) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-8 max-w-4xl w-full mx-auto border rounded-xl shadow-sm bg-card text-card-foreground">
      <div>
        <h2 className="text-3xl font-bold mb-6">Create Assignment</h2>
      </div>

      <div className="space-y-6">
        {classId ? (
          <input type="hidden" {...register('classId')} />
        ) : (
          <div>
            <label htmlFor="classId" className="block text-sm font-medium mb-1">Class ID</label>
            <Input id="classId" {...register('classId')} className="w-full md:w-1/2" />
            {errors.classId && <p className="text-red-500 text-sm mt-1">{errors.classId.message}</p>}
          </div>
        )}

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium mb-1">Due Date</label>
          <Input id="dueDate" type="datetime-local" {...register('dueDate')} className="w-full md:w-1/2" />
          {errors.dueDate && <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>}
        </div>

        <fieldset>
          <legend className="text-sm font-medium mb-2">Assignment Type</legend>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="question"
                {...register('assignmentType')}
                aria-label="Question"
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-medium">Question Builder</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="file"
                {...register('assignmentType')}
                aria-label="File"
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-medium">File Upload</span>
            </label>
          </div>
        </fieldset>

        {assignmentType === 'file' && (
          <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <label htmlFor="fileUrl" className="block text-sm font-medium mb-1">File URL</label>
            <Input id="fileUrl" {...register('fileUrl')} placeholder="https://..." className="w-full" />
            {errors.fileUrl && <p className="text-red-500 text-sm mt-1">{errors.fileUrl.message}</p>}
          </div>
        )}

        {assignmentType === 'question' && (
          <div className="space-y-6 border border-slate-200 dark:border-slate-700 p-6 rounded-xl bg-slate-50 dark:bg-slate-900/20">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Questions</h3>
              <Button type="button" onClick={() => append({ question: '', answer: '', points: 1, type: 'multiple_choice', options: ['', ''] })}>
                + Add Question
              </Button>
            </div>
            
            {fields.length === 0 && (
              <p className="text-slate-500 italic text-center py-8">No questions added yet. Click "Add Question" to begin.</p>
            )}

            <div className="space-y-6">
              {fields.map((field, index) => (
                <QuestionItem
                  key={field.id}
                  index={index}
                  control={control}
                  register={register}
                  watch={watch}
                  remove={remove}
                  errors={errors}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full text-lg mt-8">Publish Assignment</Button>
    </form>
  );
}
