
import { NextRequest, NextResponse } from 'next/server';

function createSafeSandbox() {
  const safeGlobals = {
    console: {
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      log: (...args: any[]) => {
        return args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
      }
    },
    String,
    Number,
    Boolean,
    Array,
    Object,
    Math: {
      random: Math.random,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      max: Math.max,
      min: Math.min,
      abs: Math.abs,
      sqrt: Math.sqrt,
      pow: Math.pow
    },
    Date,
    JSON: {
      parse: JSON.parse,
      stringify: JSON.stringify
    }
  };

  // Запрещенные ключевые слова и конструкции
  const forbiddenPatterns = [
    /process\./,
    /require\(/,
    /import\(/,
    /eval\(/,
    /setTimeout\(/,
    /setInterval\(/,
    /fetch\(/,
    /XMLHttpRequest/,
    /fetch/,
    /window\./,
    /document\./,
    /localStorage/,
    /sessionStorage/,
    /indexedDB/,
    /WebSocket/,
    /Worker/,
    /Function\(/,
    /constructor\(/
  ];

  return { safeGlobals, forbiddenPatterns };
}

function validateCodeSafety(code: string): { safe: boolean; error?: string } {
  const { forbiddenPatterns } = createSafeSandbox();

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(code)) {
      return { 
        safe: false, 
        error: `Обнаружена запрещенная конструкция: ${pattern}` 
      };
    }
  }

  // Дополнительные проверки
  if (code.includes('__proto__') || code.includes('prototype')) {
    return { safe: false, error: 'Запрещено использование prototype' };
  }

  if (code.length > 10000) {
    return { safe: false, error: 'Код слишком длинный' };
  }

  return { safe: true };
}
/* eslint-disable  @typescript-eslint/no-explicit-any */
function executeJavaScript(code: string, testCases?: any[]): any {
  const { safeGlobals } = createSafeSandbox();
  
  try {
    // Оборачиваем код в безопасную среду выполнения
    const wrappedCode = `
      (function() {
        let output = "";
        const console = {
          log: function(...args) {
            const result = args.map(arg => {
              if (typeof arg === 'object') {
                try {
                  return JSON.stringify(arg);
                } catch {
                  return String(arg);
                }
              }
              return String(arg);
            }).join(' ');
            output += result + '\\n';
            return result;
          }
        };
        
        // Добавляем безопасные глобальные объекты
        const { ${Object.keys(safeGlobals).join(', ')} } = safeGlobals;
        
        // Выполняем пользовательский код
        ${code}
        
        // Если код определяет функцию, тестируем ее
        if (typeof sum === 'function' && testCases) {
          for (const testCase of testCases) {
            try {
              const result = sum(...testCase.input);
              console.log(result);
            } catch (error) {
              console.log('ERROR:', error.message);
            }
          }
        }
        
        return output.trim();
      })();
    `;

    const func = new Function('safeGlobals', 'testCases', wrappedCode);
    const result = func(safeGlobals, testCases);
    
    return { output: result, error: null };
    /* eslint-disable  @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    return { output: null, error: error.message };
  }
}
/* eslint-disable  @typescript-eslint/no-explicit-any */
function executeCodeInTimeout(code: string, testCases?: any[], timeout: number = 5000): Promise<any> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ output: null, error: 'Execution timeout' });
    }, timeout);

    try {
      const result = executeJavaScript(code, testCases);
      clearTimeout(timer);
      resolve(result);
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    } catch (error: any) {
      clearTimeout(timer);
      resolve({ output: null, error: error.message });
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const { code, language, testCases } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Код обязателен для выполнения' },
        { status: 400 }
      );
    }

    // Проверяем безопасность кода
    const safetyCheck = validateCodeSafety(code);
    if (!safetyCheck.safe) {
      return NextResponse.json(
        { error: `Небезопасный код: ${safetyCheck.error}` },
        { status: 400 }
      );
    }

    // Поддерживаем только JavaScript для начала
    if (language !== 'javascript') {
      return NextResponse.json(
        { error: 'Поддерживается только JavaScript' },
        { status: 400 }
      );
    }

    // Выполняем код с таймаутом
    const result = await executeCodeInTimeout(code, testCases);

    return NextResponse.json(result);
/* eslint-disable  @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    console.error('Code execution error:', error);
    return NextResponse.json(
      { error: 'Ошибка выполнения кода: ' + error.message },
      { status: 500 }
    );
  }
}