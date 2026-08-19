import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

interface CodeEditorProps {
  code: string
  onChange: (code: string) => void
}

export function CodeEditor({ code, onChange }: CodeEditorProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <CodeMirror
        className="h-full w-full"
        value={code}
        height="100%"
        theme={oneDark}
        extensions={[javascript()]}
        onChange={onChange}
        basicSetup={{ lineNumbers: true, tabSize: 4 }}
      />
    </div>
  )
}