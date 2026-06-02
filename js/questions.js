// Java期末考试题库
const questions = {
    "chapter1-2": {
        name: "第1-2章 语法基础",
        questions: [
            {
                type: "single",
                question: "哪家公司于1995年正式对外公布Java语言？",
                options: ["IBM", "Oracle", "Microsoft", "Sun"],
                answer: 3,
                explanation: "1995年Sun公司正式发布Java语言"
            },
            {
                type: "single",
                question: "学习Java应该从哪个版本入手？",
                options: ["Java ME", "Java SE", "Java EE"],
                answer: 1,
                explanation: "Java SE是标准版，是学习Java的入门版本"
            },
            {
                type: "single",
                question: "以下哪个不是Java关键字？",
                options: ["continue", "break", "Class", "transient"],
                answer: 2,
                explanation: "Class首字母大写，不是关键字；class（小写c）才是关键字"
            },
            {
                type: "single",
                question: "byte类型的数值范围是？",
                options: ["0...255", "0...65535", "-128...127", "-32768...32767"],
                answer: 2,
                explanation: "byte占1字节，范围是-128到127"
            },
            {
                type: "single",
                question: "下列数据类型的精度由高到低的顺序是？",
                options: ["float,double,int,long", "double,float,int,byte", "byte,long,double,float", "double,int,float,long"],
                answer: 1,
                explanation: "精度从高到低：double > float > long > int > short > byte"
            },
            {
                type: "single",
                question: "下面哪一个是有效的标识符？",
                options: ["break", "default", "_object", "a-class"],
                answer: 2,
                explanation: "_object以下划线开头，是有效标识符"
            },
            {
                type: "single",
                question: "main方法的方法头以下哪项是合法的？",
                options: ["public static void main()", "public static void main(String[] args)", "public static int main(String[] arg)", "public void main(String arg[])"],
                answer: 1,
                explanation: "main方法必须是public static void main(String[] args)"
            },
            {
                type: "single",
                question: "在Java中，负责对字节代码解释执行的是？",
                options: ["应用服务器", "虚拟机", "垃圾回收器", "编译器"],
                answer: 1,
                explanation: "JVM（虚拟机）负责解释执行字节码"
            },
            {
                type: "single",
                question: "Java属于以下哪种语言？",
                options: ["机器语言", "汇编语言", "高级语言", "以上都不对"],
                answer: 2,
                explanation: "Java是高级语言"
            },
            {
                type: "single",
                question: "下面哪种类型的文件可以在Java虚拟机中运行？",
                options: [".java", ".jre", ".exe", ".class"],
                answer: 3,
                explanation: "JVM运行的是.class字节码文件"
            },
            {
                type: "single",
                question: "java.exe命令的作用是？",
                options: ["Java文档制作工具", "Java解释器", "Java编译器", "Java启动器"],
                answer: 1,
                explanation: "java.exe是Java解释器，用于运行.class文件"
            },
            {
                type: "single",
                question: "Java编译命令是？",
                options: ["java", "javac", "appletview", "javadoc"],
                answer: 1,
                explanation: "javac是Java编译命令"
            },
            {
                type: "single",
                question: "哪个反映了JAVA程序并行机制的特点？",
                options: ["安全性", "多线程", "跨平台", "可移植"],
                answer: 1,
                explanation: "多线程反映了Java程序并行机制的特点"
            },
            {
                type: "single",
                question: "Java语言的特点不包括？",
                options: ["面向对象", "跨平台", "性能低", "多线程"],
                answer: 2,
                explanation: "性能低不是Java语言的特点"
            },
            {
                type: "single",
                question: "以下数据类型转换中，必须进行强制类型转换的是？",
                options: ["int→char", "short→long", "float→double", "byte→int"],
                answer: 0,
                explanation: "int转char需要强制转换，其他都是自动转换"
            },
            {
                type: "single",
                question: "Java语言中数值数据的自动转换次序为？",
                options: ["byte→int→short→long→float→double", "byte→short→int→long→float→double", "byte→short→int→float→long→double", "short→byte→int→long→float→double"],
                answer: 1,
                explanation: "自动转换顺序：byte→short→int→long→float→double"
            },
            {
                type: "single",
                question: "int类型占用的二进制位数是？",
                options: ["8位", "16位", "32位", "64位"],
                answer: 2,
                explanation: "int占32位（4字节）"
            },
            {
                type: "single",
                question: "String s = \"story\"; 下面哪个语句不是合法的？",
                options: ["s += \"books\"", "s = s + 100", "int len = s.length", "String t = s +\"abc\""],
                answer: 2,
                explanation: "String的长度用length()方法，不是length属性"
            },
            {
                type: "single",
                question: "以下哪种是文档注释？",
                options: ["//This is comment", "/*This is comment", "/**This is comment*/", "/*This is comment*/"],
                answer: 2,
                explanation: "/** */是文档注释"
            },
            {
                type: "single",
                question: "以下哪种是多行注释？",
                options: ["//This is comment", "/*This is comment", "/**This is comment*/", "/*This is comment*/"],
                answer: 3,
                explanation: "/* */是多行注释"
            },
            {
                type: "judge",
                question: "Java语言具有较好的安全性和可移植性及与平台无关等特性。",
                answer: true,
                explanation: "正确。Java具有安全性、可移植性和平台无关性"
            },
            {
                type: "judge",
                question: "数据由高类型转换到低类型时，采用强制转换，数据精度可能要受到损失。",
                answer: true,
                explanation: "正确。高转低需要强制转换，可能损失精度"
            },
            {
                type: "judge",
                question: "Java语言只保留了指针的概念。",
                answer: false,
                explanation: "错误。Java没有指针概念"
            },
            {
                type: "judge",
                question: "用final修饰的变量叫常量。",
                answer: true,
                explanation: "正确。final修饰的变量是常量，只能赋值一次"
            },
            {
                type: "judge",
                question: "Java语言的源程序不是编译型的，而是编译解释型的。",
                answer: true,
                explanation: "正确。Java先编译为字节码，再解释执行"
            },
            {
                type: "judge",
                question: "Java程序中不区分大小写字母。",
                answer: false,
                explanation: "错误。Java区分大小写"
            },
            {
                type: "judge",
                question: "机器不能直接识别字节码文件，它要经过JVM中的解释器边解释边执行。",
                answer: true,
                explanation: "正确。字节码需要JVM解释执行"
            },
            {
                type: "judge",
                question: "所有的变量在使用前都必须进行初始化。",
                answer: false,
                explanation: "错误。成员变量有默认值，局部变量必须初始化"
            },
            {
                type: "fill",
                question: "JDK安装后一般设置三个环境变量：_______、_______、_______。",
                answer: ["java_home", "classpath", "path"],
                explanation: "三个环境变量：JAVA_HOME、CLASSPATH、PATH"
            },
            {
                type: "fill",
                question: "Java程序运行的五个步骤：_______、_______、加载、验证和_______。",
                answer: ["编辑", "编译", "运行"],
                explanation: "五个步骤：编辑、编译、加载、验证、运行"
            },
            {
                type: "fill",
                question: "Java源程序应该写在扩展名为_______的文本文件中。",
                answer: [".java"],
                explanation: "源文件扩展名是.java"
            },
            {
                type: "fill",
                question: "Java语言采用双字节的_______编码。",
                answer: ["Unicode"],
                explanation: "Java采用Unicode编码，一个字符占2字节"
            },
            {
                type: "fill",
                question: "在Java中，小数默认为_______，如果要指定float类型请在小数后加_______。",
                answer: ["double", "F"],
                explanation: "小数默认是double，float需要加F或f后缀"
            },
            {
                type: "fill",
                question: "System.out.println(10+\".\"+20); 控制台输出：_______",
                answer: ["10.20"],
                explanation: "字符串拼接，输出10.20"
            },
            {
                type: "fill",
                question: "从键盘上输入数据：Scanner input = new Scanner(_______);",
                answer: ["System.in"],
                explanation: "Scanner接收System.in标准输入"
            },
            {
                type: "fill",
                question: "Java源程序文件和字节码文件的扩展名分别为_______和_______。",
                answer: [".java", ".class"],
                explanation: "源文件.java，字节码文件.class"
            },
            {
                type: "fill",
                question: "在Java中，byte类型数据占_______个字节，short占_______个字节，int占_______个字节，long占_______个字节。",
                answer: ["1", "2", "4", "8"],
                explanation: "byte=1字节，short=2字节，int=4字节，long=8字节"
            }
        ]
    },
    "chapter3": {
        name: "第3章 流程控制",
        questions: [
            {
                type: "single",
                question: "以下哪个关键字用来定义成员常量？",
                options: ["finalize", "final", "finally", "const"],
                answer: 1,
                explanation: "final用来定义常量"
            },
            {
                type: "single",
                question: "int a=2, b=4; if(a < --b) a*=a; 执行后b的值为？",
                options: ["5", "3", "15", "10"],
                answer: 1,
                explanation: "--b先减为3，然后a<3成立，a=4，b=3"
            },
            {
                type: "single",
                question: "若a和b均是整型变量，正确的switch语句为？",
                options: ["switch(a+b); { }", "switch( a+b*3.0 ) { }", "switch a { }", "switch ( a%b ) { }"],
                answer: 3,
                explanation: "switch表达式必须是整数类型"
            },
            {
                type: "single",
                question: "for(int x=0;(x==0)&(x>4);x++); 执行次数为？",
                options: ["无限次", "一次也不执行", "执行4次", "执行3次"],
                answer: 1,
                explanation: "x=0时，x>4为false，循环不执行"
            },
            {
                type: "single",
                question: "int j=2; for(int i=7; i>0; i-=2) j*=2; 执行后j的值为？",
                options: ["15", "1", "60", "32"],
                answer: 3,
                explanation: "循环4次(i=7,5,3,1)，j=2*2*2*2*2=32"
            },
            {
                type: "single",
                question: "int m=3, n=6, k=0; while((m++) < (--n)) ++k; 执行后k的值为？",
                options: ["0", "1", "2", "3"],
                answer: 1,
                explanation: "m=3,n=5时满足条件k=1，之后m=4,n=4不满足"
            },
            {
                type: "single",
                question: "continue语句的作用是？",
                options: ["跳过下一条语句", "跳出程序", "跳出本循环，执行下一轮循环", "是一条空语句"],
                answer: 2,
                explanation: "continue跳过本次循环，执行下一次循环"
            },
            {
                type: "single",
                question: "break语句的作用是？",
                options: ["跳过循环", "跳出程序", "跳出本循环，执行下一轮循环", "是一条空语句"],
                answer: 0,
                explanation: "break跳出整个循环"
            },
            {
                type: "single",
                question: "do-while循环的特点是？",
                options: ["先判断后执行", "先执行后判断", "不执行", "死循环"],
                answer: 1,
                explanation: "do-while先执行后判断，至少执行一次"
            },
            {
                type: "single",
                question: "while(true) { } 这是什么循环？",
                options: ["执行0次", "执行1次", "死循环", "编译错误"],
                answer: 2,
                explanation: "while(true)是死循环"
            },
            {
                type: "single",
                question: "System.out.println(10/3); 的输出结果是？",
                options: ["3.33", "3", "3.0", "报错"],
                answer: 1,
                explanation: "整数除法，10/3=3"
            },
            {
                type: "single",
                question: "System.out.println(3.0/6*12); 的输出结果是？",
                options: ["0", "6", "6.0", "0.0"],
                answer: 2,
                explanation: "浮点除法，3.0/6*12=6.0"
            },
            {
                type: "single",
                question: "System.out.println(\"*\"+10+20); 的输出结果是？",
                options: ["*30", "*1020", "30*", "1020*"],
                answer: 1,
                explanation: "字符串拼接从左到右，\"*\"+10=\"*10\"，\"*10\"+20=\"*1020\""
            },
            {
                type: "single",
                question: "System.out.println(10+20+\"*\"); 的输出结果是？",
                options: ["*30", "*1020", "30*", "1020*"],
                answer: 2,
                explanation: "先算10+20=30，再拼接\"*\"，结果是\"30*\""
            },
            {
                type: "single",
                question: "x的y次方在Java中怎么写？",
                options: ["Math.pow(x,y)", "Math.power(x,y)", "x^y", "Math.sqrt(x,y)"],
                answer: 0,
                explanation: "Math.pow(x,y)表示x的y次方"
            },
            {
                type: "single",
                question: "赋值语句是？",
                options: ["=", "==", "===", "!="],
                answer: 0,
                explanation: "=是赋值，==是比较相等"
            },
            {
                type: "judge",
                question: "switch语句中如果没有break，会穿透执行下一个case。",
                answer: true,
                explanation: "正确。没有break会穿透执行"
            },
            {
                type: "judge",
                question: "do-while循环至少执行一次。",
                answer: true,
                explanation: "正确。do-while先执行后判断"
            },
            {
                type: "judge",
                question: "for循环和while循环都是先判断后执行。",
                answer: true,
                explanation: "正确。for和while都是先判断条件"
            },
            {
                type: "judge",
                question: "break语句可以跳出多层循环。",
                answer: false,
                explanation: "错误。break只能跳出当前循环"
            },
            {
                type: "fill",
                question: "for语句的无限循环语句：_______；while语句的无限循环语句：_______。",
                answer: ["for(;;)", "while(true)"],
                explanation: "for(;;)和while(true)都是无限循环"
            },
            {
                type: "fill",
                question: "do...while语句是_______；循环体执行次数>=_______。",
                answer: ["先执行后判断", "1"],
                explanation: "do-while先执行后判断，至少执行1次"
            },
            {
                type: "fill",
                question: "根号10在Java中写成：double d=_______；",
                answer: ["Math.sqrt(10)"],
                explanation: "Math.sqrt()求平方根"
            }
        ]
    },
    "chapter4": {
        name: "第4章 数组和字符串",
        questions: [
            {
                type: "single",
                question: "定义了一维int型数组a[10]后，下面错误的引用是？",
                options: ["a[0]=1", "a[10]=2", "a[0]=5*2", "a[1]=a[2]*a[0]"],
                answer: 1,
                explanation: "a[10]越界，数组下标0-9"
            },
            {
                type: "single",
                question: "下面的二维数组初始化语句中，正确的是？",
                options: ["float b[2][2]={0.1,0.2,0.3,0.4}", "int a[][]={{1,2},{3,4}}", "int a[2][]= {{1,2},{3,4}}", "float a[2][2]={0}"],
                answer: 1,
                explanation: "int a[][]={{1,2},{3,4}}是正确的二维数组初始化"
            },
            {
                type: "single",
                question: "数组在Java中储存在？",
                options: ["栈", "队列", "堆", "链表"],
                answer: 2,
                explanation: "数组存储在堆内存中"
            },
            {
                type: "single",
                question: "数组a的第三个元素表示为？",
                options: ["a(3)", "a[3]", "a(2)", "a[2]"],
                answer: 3,
                explanation: "数组下标从0开始，第三个元素是a[2]"
            },
            {
                type: "single",
                question: "定义了int型二维数组a[6][7]后，数组元素a[3][4]前的数组元素个数？",
                options: ["24", "25", "18", "17"],
                answer: 1,
                explanation: "3*7+4=25"
            },
            {
                type: "single",
                question: "下列关于Java语言的数组描述中，错误的是？",
                options: ["数组的长度通常用length表示", "数组下标从0开始", "数组元素是按顺序存放在内存的", "数组空间大小可以任意扩充"],
                answer: 3,
                explanation: "数组长度固定，不能任意扩充"
            },
            {
                type: "single",
                question: "int[] ia=new int[10]; 将数组ia所有元素赋值为1的代码是？",
                options: ["Arrays.fill(ia,1)", "Arrays.set(ia,1)", "ia.fill(1)", "ia.set(1)"],
                answer: 0,
                explanation: "Arrays.fill()方法填充数组"
            },
            {
                type: "single",
                question: "数组复制时，\"=\"将一个数组的什么传递给另一个数组？",
                options: ["值", "引用", "副本", "克隆"],
                answer: 1,
                explanation: "=复制的是引用（地址），两个变量指向同一个数组"
            },
            {
                type: "judge",
                question: "数组下标从1开始。",
                answer: false,
                explanation: "错误。Java数组下标从0开始"
            },
            {
                type: "judge",
                question: "数组长度用length()方法获取。",
                answer: false,
                explanation: "错误。数组长度用length属性，不是方法"
            },
            {
                type: "judge",
                question: "数组空间大小可以任意扩充。",
                answer: false,
                explanation: "错误。数组长度固定，不能扩充"
            },
            {
                type: "judge",
                question: "String的长度用length()方法获取。",
                answer: true,
                explanation: "正确。String长度用length()方法"
            },
            {
                type: "fill",
                question: "数组最小的下标是_______。",
                answer: ["0"],
                explanation: "数组下标从0开始"
            },
            {
                type: "fill",
                question: "JVM将数组元素存储在_______（堆或栈）中。",
                answer: ["堆"],
                explanation: "数组存储在堆中"
            },
            {
                type: "fill",
                question: "String s=\"abc\"; char[] ca=s._______();",
                answer: ["toCharArray"],
                explanation: "toCharArray()将String转为字符数组"
            },
            {
                type: "fill",
                question: "String s=\"127\"; 将s转换为int的代码：int i=_______",
                answer: ["Integer.parseInt(s)"],
                explanation: "Integer.parseInt()将字符串转为int"
            },
            {
                type: "fill",
                question: "矩阵或表格一般用_______维数组表示。",
                answer: ["二"],
                explanation: "矩阵用二维数组表示"
            }
        ]
    },
    "chapter5": {
        name: "第5章 面向对象基础",
        questions: [
            {
                type: "single",
                question: "为了区分类中重载的同名的不同方法，要求？",
                options: ["采用不同的形式参数列表", "返回值类型不同", "调用时用类名或对象名做前缀", "参数名不同"],
                answer: 0,
                explanation: "方法重载靠参数列表区分"
            },
            {
                type: "single",
                question: "以public修饰的类，如：public class Car{…} 则该类？",
                options: ["可被其它程序包中的类使用", "仅能被本程序包中的类使用", "不能被任意其它类使用", "不能被其它类继承"],
                answer: 0,
                explanation: "public类可以被其他包的类使用"
            },
            {
                type: "single",
                question: "下列修饰符中与访问控制无关的是？",
                options: ["private", "public", "protected", "final"],
                answer: 3,
                explanation: "final不是访问控制修饰符"
            },
            {
                type: "single",
                question: "有一个类A，以下为其构造方法的声明，其中正确的是？",
                options: ["void A(int x){...}", "A(int x){...}", "a(int x){...}", "void a(int x){...}"],
                answer: 1,
                explanation: "构造方法没有返回值，方法名与类名相同"
            },
            {
                type: "single",
                question: "在以下什么情况下，构造方法会被调用？",
                options: ["类定义时", "调用对象方法时", "创建对象时", "使用对象的变量时"],
                answer: 2,
                explanation: "创建对象时调用构造方法"
            },
            {
                type: "single",
                question: "以下不属于面向对象程序设计的基本特征的是？",
                options: ["抽象性", "继承性", "多态性", "合法性"],
                answer: 3,
                explanation: "面向对象三大特征：封装、继承、多态"
            },
            {
                type: "single",
                question: "有关类和对象的叙述不正确的是？",
                options: ["对象是类的一个实例", "任何一个对象都属于一个具体的类", "一个类只能有一个对象", "类和对象的关系和数据类型与变量的关系相似"],
                answer: 2,
                explanation: "一个类可以创建多个对象"
            },
            {
                type: "single",
                question: "关于类的构造方法的叙述不正确的是？",
                options: ["构造方法可以有参数", "一个类只能有一个构造方法", "构造方法没有返回值的类型", "构造方法的名称必须与类名相同"],
                answer: 1,
                explanation: "一个类可以有多个构造方法（重载）"
            },
            {
                type: "single",
                question: "关于this关键字，以下说法不正确的是？",
                options: ["this是对对象自身的调用", "使用this可以处理局部变量与参数重名", "在static方法中可以使用this", "当必须指出当前使用方法的对象是谁时要使用this"],
                answer: 2,
                explanation: "static方法中不能使用this"
            },
            {
                type: "single",
                question: "被static关键字修饰的成员变量被称为？",
                options: ["局部变量", "静态变量", "成员变量", "常量"],
                answer: 1,
                explanation: "static修饰的变量是静态变量"
            },
            {
                type: "single",
                question: "类的封装是指将类中的属性私有化，使用什么关键字来修饰？",
                options: ["public", "protected", "private", "static"],
                answer: 2,
                explanation: "private修饰私有属性"
            },
            {
                type: "single",
                question: "面向对象的三大特征是？",
                options: ["封装、继承、多态", "封装、继承、抽象", "继承、多态、抽象", "封装、多态、抽象"],
                answer: 0,
                explanation: "面向对象三大特征：封装、继承、多态"
            },
            {
                type: "single",
                question: "创建或实例化对象一般通过什么方式来完成？",
                options: ["new + 构造方法()", "类名 + 方法()", "对象 + 方法()", "直接调用"],
                answer: 0,
                explanation: "new + 构造方法()创建对象"
            },
            {
                type: "single",
                question: "定义在类中的变量被称为？",
                options: ["局部变量", "成员变量", "静态变量", "常量"],
                answer: 1,
                explanation: "类中定义的是成员变量"
            },
            {
                type: "single",
                question: "在非静态成员方法中，可以使用什么关键字访问类的其它非静态成员？",
                options: ["this", "super", "static", "final"],
                answer: 0,
                explanation: "this指当前对象"
            },
            {
                type: "single",
                question: "this指什么？",
                options: ["父类对象", "当前对象", "子类对象", "静态对象"],
                answer: 1,
                explanation: "this指当前对象"
            },
            {
                type: "judge",
                question: "构造方法可以有参数。",
                answer: true,
                explanation: "正确。构造方法可以重载，可以有参数"
            },
            {
                type: "judge",
                question: "一个类只能有一个构造方法。",
                answer: false,
                explanation: "错误。一个类可以有多个构造方法（重载）"
            },
            {
                type: "judge",
                question: "构造方法没有返回值的类型。",
                answer: true,
                explanation: "正确。构造方法没有返回值"
            },
            {
                type: "judge",
                question: "构造方法的名称必须与类名相同。",
                answer: true,
                explanation: "正确。构造方法名与类名相同"
            },
            {
                type: "judge",
                question: "定义了有参构造方法后，系统默认的无参构造方法依然存在。",
                answer: false,
                explanation: "错误。定义有参构造后，无参构造不会自动生成"
            },
            {
                type: "judge",
                question: "成员方法的重载和覆盖是同一回事。",
                answer: false,
                explanation: "错误。重载和覆盖是不同的概念"
            },
            {
                type: "fill",
                question: "面向对象的三大特征是_______、_______和_______。",
                answer: ["封装", "继承", "多态"],
                explanation: "面向对象三大特征：封装、继承、多态"
            },
            {
                type: "fill",
                question: "创建或实例化对象一般通过\"_______+构造方法()\"的方式来完成。",
                answer: ["new"],
                explanation: "new关键字创建对象"
            },
            {
                type: "fill",
                question: "_______方法是Java类中一种特殊方法，用于实例化类的一个对象。",
                answer: ["构造"],
                explanation: "构造方法用于创建对象"
            },
            {
                type: "fill",
                question: "定义在类中的变量被称为_______，定义在方法中的变量被称为_______。",
                answer: ["成员变量", "局部变量"],
                explanation: "类中的是成员变量，方法中的是局部变量"
            },
            {
                type: "fill",
                question: "在非静态成员方法中，可以使用关键字_______访问类的其它非静态成员。",
                answer: ["this"],
                explanation: "this指当前对象"
            },
            {
                type: "fill",
                question: "this指_______，super指_______。",
                answer: ["当前对象", "父类对象"],
                explanation: "this指当前对象，super指父类对象"
            }
        ]
    },
    "chapter6": {
        name: "第6章 面向对象高级",
        questions: [
            {
                type: "single",
                question: "以下哪个关键字用来定义成员常量？",
                options: ["finalize", "final", "finally", "const"],
                answer: 1,
                explanation: "final用来定义常量"
            },
            {
                type: "single",
                question: "定义接口的关键字是？",
                options: ["class", "interface", "abstract", "implements"],
                answer: 1,
                explanation: "interface定义接口"
            },
            {
                type: "single",
                question: "用什么修饰的类叫抽象类？",
                options: ["final", "static", "abstract", "public"],
                answer: 2,
                explanation: "abstract修饰抽象类"
            },
            {
                type: "single",
                question: "用什么修饰的类叫最终类？",
                options: ["final", "static", "abstract", "public"],
                answer: 0,
                explanation: "final修饰最终类"
            },
            {
                type: "single",
                question: "接口中只能定义什么？",
                options: ["变量和方法", "常量和抽象方法", "构造方法", "静态方法"],
                answer: 1,
                explanation: "接口只能定义常量和抽象方法"
            },
            {
                type: "single",
                question: "Java中一个类最多可以有几个父类？",
                options: ["0个", "1个", "2个", "多个"],
                answer: 1,
                explanation: "Java单继承，只能有1个父类"
            },
            {
                type: "single",
                question: "Java中一个类可以实现几个接口？",
                options: ["0个", "1个", "2个", "多个"],
                answer: 3,
                explanation: "可以实现多个接口"
            },
            {
                type: "judge",
                question: "final修饰符不属于访问控制修饰符。",
                answer: true,
                explanation: "正确。final不是访问控制修饰符"
            },
            {
                type: "judge",
                question: "在一个合法的Java源程序文件中定义了3个类，其中修饰符为public的类可能有3个。",
                answer: false,
                explanation: "错误。一个源文件最多1个public类"
            },
            {
                type: "judge",
                question: "Java中一个类最多可以有一个父类，但可以实现多个接口。",
                answer: true,
                explanation: "正确。单继承，多实现"
            },
            {
                type: "judge",
                question: "finally关键字可以用来定义成员常量。",
                answer: false,
                explanation: "错误。定义常量用final，不是finally"
            },
            {
                type: "fill",
                question: "_______修饰的方法为抽象方法。定义接口的关键字是_______。",
                answer: ["abstract", "interface"],
                explanation: "abstract修饰抽象方法，interface定义接口"
            },
            {
                type: "fill",
                question: "用_______修饰的类叫抽象类。用_______修饰的类叫最终类。",
                answer: ["abstract", "final"],
                explanation: "abstract修饰抽象类，final修饰最终类"
            },
            {
                type: "fill",
                question: "接口本质上是一个比抽象类更加抽象的类，在接口中只能定义_______和_______。",
                answer: ["常量", "抽象方法"],
                explanation: "接口只能定义常量和抽象方法"
            }
        ]
    },
    "chapter7": {
        name: "第7章 异常",
        questions: [
            {
                type: "single",
                question: "在异常处理中，如释放资源、关闭文件等由什么来完成？",
                options: ["throw", "finally", "try", "catch"],
                answer: 1,
                explanation: "finally块用于释放资源，一定会执行"
            },
            {
                type: "single",
                question: "所有的异常类皆继承哪一个类？",
                options: ["java.lang.Throwable", "java.lang.Exception", "java.lang.Error", "java.io.Exception"],
                answer: 0,
                explanation: "所有异常类继承Throwable"
            },
            {
                type: "single",
                question: "哪个关键字可以抛出异常？",
                options: ["transient", "throw", "finally", "catch"],
                answer: 1,
                explanation: "throw关键字抛出异常"
            },
            {
                type: "single",
                question: "Error类所定义的异常是？",
                options: ["可以捕获", "无法捕获", "只能抛出", "编译异常"],
                answer: 1,
                explanation: "Error类异常无法捕获"
            },
            {
                type: "single",
                question: "IOException异常是？",
                options: ["运行时异常", "非运行时异常", "错误", "不需要处理"],
                answer: 1,
                explanation: "IOException是非运行时异常，必须捕获或抛出"
            },
            {
                type: "single",
                question: "用户自定义异常类是通过继承什么类来创建的？",
                options: ["Throwable", "Exception", "Error", "RuntimeException"],
                answer: 1,
                explanation: "自定义异常继承Exception类"
            },
            {
                type: "single",
                question: "try { return; } finally { System.out.println(\"Finally\"); } 程序运行结果是？",
                options: ["编译错误", "输出Finally", "不输出", "运行异常"],
                answer: 1,
                explanation: "finally在return之前执行，会输出Finally"
            },
            {
                type: "single",
                question: "对于已经被定义过可能抛出异常的语句，在编程时应该？",
                options: ["必须使用try/catch语句处理异常，或用throw将其抛出", "如果程序错误，必须使用try/catch语句处理异常", "可以置之不理", "只能使用try/catch语句处理"],
                answer: 0,
                explanation: "必须处理或抛出异常"
            },
            {
                type: "judge",
                question: "catch块后必须有finally块。",
                answer: false,
                explanation: "错误。finally是可选的"
            },
            {
                type: "judge",
                question: "Throwable类有两个子类：Error类和Exception类。",
                answer: true,
                explanation: "正确。Throwable有Error和Exception两个子类"
            },
            {
                type: "judge",
                question: "使用try-catch-finally语句只能捕获一个异常。",
                answer: false,
                explanation: "错误。可以有多个catch捕获多个异常"
            },
            {
                type: "judge",
                question: "try-catch语句不可以嵌套使用。",
                answer: false,
                explanation: "错误。try-catch可以嵌套使用"
            },
            {
                type: "judge",
                question: "Error类所定义的异常是无法捕获的。",
                answer: true,
                explanation: "正确。Error无法捕获"
            },
            {
                type: "judge",
                question: "IOException异常是非运行时异常，必须在程序中抛弃或捕获。",
                answer: true,
                explanation: "正确。IOException必须处理"
            },
            {
                type: "judge",
                question: "用户自定义异常类是通过继承Throwable类来创建的。",
                answer: false,
                explanation: "错误。自定义异常继承Exception，不是Throwable"
            },
            {
                type: "judge",
                question: "当一个方法在运行过程中产生一个异常，则这个方法会终止，但是整个程序不一定终止运行。",
                answer: true,
                explanation: "正确。方法终止但程序不一定终止"
            },
            {
                type: "fill",
                question: "程序可能发生异常时，应该把不管异常发生与否都执行的代码放到_______子句中。",
                answer: ["finally"],
                explanation: "finally块一定会执行"
            },
            {
                type: "fill",
                question: "用运算符_______可以判断一个对象是不是某一个类的对象。",
                answer: ["instanceof"],
                explanation: "instanceof判断对象类型"
            },
            {
                type: "fill",
                question: "异常可以分为_______和其他编译器需要检测的异常。",
                answer: ["运行时异常"],
                explanation: "异常分为运行时异常和检查异常"
            },
            {
                type: "fill",
                question: "_______类所定义的异常是无法捕获的。",
                answer: ["Error"],
                explanation: "Error类异常无法捕获"
            },
            {
                type: "fill",
                question: "IOException异常是非运行时异常，必须在程序中_______或捕获。",
                answer: ["抛出"],
                explanation: "IOException必须抛出或捕获"
            },
            {
                type: "fill",
                question: "异常处理是由try、_______和finally块三个关键所组成的程序块。",
                answer: ["catch"],
                explanation: "异常处理三要素：try、catch、finally"
            }
        ]
    },
    "chapter9": {
        name: "第9章 IO流",
        questions: [
            {
                type: "single",
                question: "以下选项中，哪个是FileOutputStream的父类？",
                options: ["File", "FileOutput", "OutputStream", "InputStream"],
                answer: 2,
                explanation: "FileOutputStream继承OutputStream"
            },
            {
                type: "single",
                question: "File类中以字符串形式返回文件绝对路径的方法是？",
                options: ["getParent()", "getName()", "getAbsolutePath()", "getPath()"],
                answer: 2,
                explanation: "getAbsolutePath()返回绝对路径"
            },
            {
                type: "single",
                question: "以下选项中，哪个流中使用了缓冲区技术？",
                options: ["BufferedOutputStream", "FileInputStream", "DataOutputStream", "FileReader"],
                answer: 0,
                explanation: "BufferedOutputStream使用缓冲区"
            },
            {
                type: "single",
                question: "以下选项中，哪个文件操作类可以实现一次读入多个文件？",
                options: ["FileReader", "BufferedReader", "FileInputStream", "SequenceInputStream"],
                answer: 3,
                explanation: "SequenceInputStream可以合并多个输入流"
            },
            {
                type: "single",
                question: "下面哪一个import命令可以为我们提供编写输入输出程序的类？",
                options: ["import java.sql.*", "import java.util.*", "import java.io.*", "import java.net.*"],
                answer: 2,
                explanation: "java.io包提供IO类"
            },
            {
                type: "single",
                question: "如果需要从文件中读取数据，则可以在程序中创建哪一个类的对象？",
                options: ["FileInputStream", "FileOutputStream", "DataOutputStream", "FileWriter"],
                answer: 0,
                explanation: "FileInputStream用于读取文件"
            },
            {
                type: "single",
                question: "实现字符流的写操作类是？",
                options: ["FileReader", "Writer", "FileInputStream", "FileOutputStream"],
                answer: 1,
                explanation: "Writer是字符输出流"
            },
            {
                type: "single",
                question: "实现字符流的读操作类是？",
                options: ["FileReader", "Writer", "FileInputStream", "FileOutputStream"],
                answer: 0,
                explanation: "FileReader是字符输入流"
            },
            {
                type: "single",
                question: "下列流中哪个不属于字符流？",
                options: ["InputStreamReader", "BufferedReader", "FilterReader", "FileInputStream"],
                answer: 3,
                explanation: "FileInputStream是字节流"
            },
            {
                type: "single",
                question: "字符流与字节流的区别在于？",
                options: ["前者带有缓冲，后者没有", "前者是块读写，后者是字节读写", "二者没有区别", "每次读写的字节数不同"],
                answer: 3,
                explanation: "字节流每次读1字节，字符流每次读2字节"
            },
            {
                type: "single",
                question: "构造BufferedInputStream的合适参数是？",
                options: ["BufferedOutputStream", "FileInputStream", "FileOutputStream", "File"],
                answer: 1,
                explanation: "BufferedInputStream接收InputStream参数"
            },
            {
                type: "single",
                question: "Java中提供了一个类，可以随机地从文件的任何位置开始执行读写数据的操作，这个类是？",
                options: ["FileInputStream", "FileOutputStream", "RandomAccessFile", "BufferedReader"],
                answer: 2,
                explanation: "RandomAccessFile支持随机读写"
            },
            {
                type: "single",
                question: "在Java中，能实现线程间通信的流是？",
                options: ["文件流", "管道流", "缓冲流", "转换流"],
                answer: 1,
                explanation: "管道流用于线程间通信"
            },
            {
                type: "single",
                question: "System.out是哪个类的对象？",
                options: ["InputStream", "OutputStream", "PrintStream", "BufferedReader"],
                answer: 2,
                explanation: "System.out是PrintStream类的对象"
            },
            {
                type: "single",
                question: "Java中一个字符占用几个字节？",
                options: ["1", "2", "4", "8"],
                answer: 1,
                explanation: "Java字符占2字节，使用Unicode编码"
            },
            {
                type: "judge",
                question: "InputStreamReader类是用于将字节流转换为字符流。",
                answer: true,
                explanation: "正确。InputStreamReader是字节流到字符流的桥梁"
            },
            {
                type: "judge",
                question: "Java对象序列化需要实现Serializable接口。",
                answer: true,
                explanation: "正确。序列化需要实现Serializable接口"
            },
            {
                type: "judge",
                question: "FileInputStream是字符流。",
                answer: false,
                explanation: "错误。FileInputStream是字节流"
            },
            {
                type: "judge",
                question: "BufferedWriter的newLine()方法可以写入一个换行符。",
                answer: true,
                explanation: "正确。newLine()写入换行符"
            },
            {
                type: "fill",
                question: "JDK中与输入输出相关的包和类都集中存放在_______包中。",
                answer: ["java.io"],
                explanation: "IO类在java.io包中"
            },
            {
                type: "fill",
                question: "最重要的4个抽象类：_______、_______、_______和_______。",
                answer: ["InputStream", "OutputStream", "Reader", "Writer"],
                explanation: "IO流四大抽象类"
            },
            {
                type: "fill",
                question: "将字节流转换为字符流的桥梁类是_______。",
                answer: ["InputStreamReader"],
                explanation: "InputStreamReader是字节流到字符流的桥梁"
            },
            {
                type: "fill",
                question: "Java对象序列化需要实现_______接口。",
                answer: ["Serializable"],
                explanation: "Serializable是序列化接口"
            },
            {
                type: "fill",
                question: "Java通过_______类实现对象的序列化，通过_______类实现对象的反序列化。",
                answer: ["ObjectOutputStream", "ObjectInputStream"],
                explanation: "ObjectOutputStream序列化，ObjectInputStream反序列化"
            },
            {
                type: "fill",
                question: "Java中的IO流，按照传输数据不同，可分为_______和_______。",
                answer: ["字节流", "字符流"],
                explanation: "IO流分为字节流和字符流"
            },
            {
                type: "fill",
                question: "在Java中，_______类用于操作磁盘中文件和目录，位于_______包中。",
                answer: ["File", "java.io"],
                explanation: "File类在java.io包中"
            },
            {
                type: "fill",
                question: "Java中一个字符占用_______个字节，所有字符采用的都是_______码表。",
                answer: ["2", "Unicode"],
                explanation: "Java字符占2字节，使用Unicode编码"
            }
        ]
    }
};
