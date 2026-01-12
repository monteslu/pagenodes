import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import './CodeInput.css';

const highlight = (code, language) => {
  const grammar = Prism.languages[language] || Prism.languages.javascript;
  return Prism.highlight(code, grammar, language);
};

export function CodeInput({ value, onChange, language = 'javascript', style }) {
  return (
    <div className="code-input-wrapper" style={style}>
      <Editor
        value={value || ''}
        onValueChange={onChange}
        highlight={(code) => highlight(code, language)}
        padding={8}
        className="code-input-editor"
        textareaClassName="code-input-textarea"
        style={{
          fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
          fontSize: 13,
          lineHeight: 1.4,
        }}
      />
    </div>
  );
}
