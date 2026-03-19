import { memo, useState, useRef, useEffect } from 'react';

const InlineDimensionEditor = memo(({ 
  value, 
  x, 
  y, 
  isHorizontal = true,
  onSubmit, 
  onCancel 
}) => {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSubmit = () => {
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue > 0) {
      onSubmit(numValue);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    handleSubmit();
  };

  const offsetX = isHorizontal ? 0 : 10;
  const offsetY = isHorizontal ? -5 : 0;

  return (
    <foreignObject x={x - 20} y={y + offsetY - 8} width={40} height={20}>
      <input
        ref={inputRef}
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full h-full px-1 text-center text-[7px] font-mono bg-white border border-blue-500 rounded shadow-md outline-none"
        step="0.1"
        min="0.1"
      />
    </foreignObject>
  );
});

InlineDimensionEditor.displayName = 'InlineDimensionEditor';

export default InlineDimensionEditor;
