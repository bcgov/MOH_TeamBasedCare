interface AppErrorMessageProps {
  message: string;
}

export const AppErrorMessage: React.FC<AppErrorMessageProps> = ({ message }) => {
  return (
    <>
      <div className='p-4 alert text-bcRedError'>{message}</div>
    </>
  );
};
