const body=document.body;
const lightModeColors = [
  '#ffe4e1', '#ffefd5', '#e0ffff', '#f0e68c', '#dda0dd',
  '#98fb98', '#add8e6', '#fafad2', '#f5deb3', '#ffe4b5',
  '#d8bfd8', '#c1ffc1', '#e6e6fa', '#fff0f5', '#b0e0e6',
  '#fdf5e6', '#f5f5dc', '#e3f2fd', '#f0fff0', '#fffacd'
];
const darkModeColors = [
  '#2c3e50', '#34495e', '#3b3b3b', '#4e4e4e', '#5c3d5c',
  '#2f4f4f', '#3a3a3a', '#3b2f2f', '#393939', '#2e3b4e',
  '#4a4a4a', '#3e3e3e', '#464646', '#22313f', '#2d2d30',
  '#292929', '#2e2e38', '#403f4c', '#333366', '#2b2b2b'
];
const colorMap = {
  '#ffe4e1': '#3b2f2f',
  '#ffefd5': '#3b3b3b',
  '#e0ffff': '#2f4f4f',
  '#f0e68c': '#4f4f2f',
  '#dda0dd': '#5c3d5c',
  '#98fb98': '#2f5f2f',
  '#add8e6': '#2e3b4e',
  '#fafad2': '#3a3a3a',
  '#f5deb3': '#393939',
  '#ffe4b5': '#2d2d30',
  '#d8bfd8': '#403f4c',
  '#c1ffc1': '#292929',
  '#e6e6fa': '#2e2e38',
  '#fff0f5': '#2c3e50',
  '#b0e0e6': '#22313f',
  '#fdf5e6': '#2b2b2b',
  '#f5f5dc': '#2c2c2c',
  '#e3f2fd': '#333366',
  '#f0fff0': '#2a2a2a',
  '#fffacd': '#2e2e2e'
};
const reverseColorMap=Object.fromEntries(
  Object.entries(colorMap).map(([light, dark])=>[dark, light])
);
const darkModeBackgrounds={
  '#ffe4e1':'#5a3f3f',
  '#e0ffff':'#2f4f4f',
  '#f0e68c':'#4f4f2f',
  '#dda0dd':'#5d3d5d',
  '#98fb98':'#2f5f2f',
};

const trash=document.getElementById('trash');
let editingNote=null;
let currentEditorColor=null;
let activeTagFilters=new Set();
let currentListStyle = '';

function getRandomColor() {
  const isDark = body.classList.contains('dark');
  const colorPool = isDark ? darkModeColors : lightModeColors;
  return colorPool[Math.floor(Math.random() * colorPool.length)];
}

function addNote(){
  const text=document.getElementById('noteText').value;
  if(text.trim()==='')return;
  const note=document.createElement('div');
  note.className='note';
  note.textContent=text;
  note.style.backgroundColor=getRandomColor();
  note.style.left=`${Math.random()*(window.innerWidth-200)}px`;
  note.style.top=`${Math.random()*(window.innerHeight-200)}px`;
  const editBtn=document.createElement('button');
  editBtn.className='edit-btn';
  editBtn.textContent='✏️';
  editBtn.onclick=()=>{
    const newText=prompt("Edit your note:",note.textContent);
    if(newText!==null)note.textContent=newText;
    note.appendChild(editBtn);
  };
  note.appendChild(editBtn);
  makeDraggable(note);
  body.appendChild(note);
  document.getElementById('noteText').value="";
  closeModals();
}

function openNoteModal(note=null) {
  const editor=document.getElementById('noteEditor');
  const modal=document.getElementById('noteModal');
  const toolbar=modal.querySelector('.toolbar');
  if (note) {
    editor.innerHTML=note.innerHTML.replace(/<button.*<\/button>/,'');
    currentEditorColor=note.style.backgroundColor;
  } else{
    currentEditorColor=getRandomColor();
    editor.innerHTML='';
  }
  modal.querySelector('.modal-content').style.backgroundColor=currentEditorColor;
  editor.style.backgroundColor=currentEditorColor;
  editor.style.color=body.classList.contains('dark')?'#fff':'#000';
  const textColor=body.classList.contains('dark')?'#fff':'#000';
  const borderColor=body.classList.contains('dark')?'#666':'#ccc';
  toolbar.querySelectorAll('button,select,input[type="color"]').forEach(el=>{
    el.style.backgroundColor='rgba(255,255,255,0.8)';
    el.style.color=textColor;
    el.style.border=`1px solid ${borderColor}`;
  });
  editingNote=note;
  clearFormattingStates();
  modal.querySelector('select').value = '';
  modal.classList.add('active');
}

function saveNote(){
  const editor=document.getElementById('noteEditor');
  const html=editor.innerHTML.trim();
  if(html===''||html==='<br>')return;
  if (editingNote) {
  editingNote.style.color=body.classList.contains('dark')?'#ffffff':'#000000';
  editingNote.innerHTML=highlightHashtags(html);
  attachEditButton(editingNote);
  }else{
    const note=document.createElement('div');
    note.className='note';
    note.innerHTML=highlightHashtags(html);
    note.style.backgroundColor=currentEditorColor||getRandomColor();
    note.style.color=body.classList.contains('dark')?'#ffffff':'#000000';
    note.style.left=`${Math.random()*(window.innerWidth-200)}px`;
    note.style.top=`${Math.random()*(window.innerHeight-200)}px`;
    note.style.width='200px';
    note.style.height='200px';
    attachEditButton(note);
    makeDraggable(note);
    body.appendChild(note);
    extractTagsFromNote(note);
  }
  editingNote=null;
  editor.innerHTML='';
  saveNotesToStorage();
  closeModals();}

function attachEditButton(note) {
  const existingEdit=note.querySelector('.edit-btn');
  const existingPin=note.querySelector('.pin-btn');
  if (existingEdit) existingEdit.remove();
  if (existingPin) existingPin.remove();
  const editBtn=document.createElement('button');
  editBtn.className='edit-btn';
  editBtn.textContent='✏️';
  editBtn.onclick=()=>openNoteModal(note);
  note.appendChild(editBtn);
  const pinBtn=document.createElement('button');
  pinBtn.className='pin-btn';
  pinBtn.textContent='📌';
  pinBtn.onclick=(e)=>{
    e.stopPropagation();
    togglePin(note);
  };
  note.appendChild(pinBtn);
}


function focusEditor() {
  const editor=document.getElementById('noteEditor');
  editor.focus();
}

function makeDraggable(el) {
  let offsetX,offsetY;
  let isDragging=false;
  el.addEventListener('mousedown',function (e) {
    if (el.classList.contains('pinned')) return;
    offsetX=e.clientX-el.offsetLeft;
    offsetY=e.clientY-el.offsetTop;
    isDragging=true;
    trash.classList.add('show');
    function mouseMoveHandler(e) {
      if (!isDragging) return;
      el.style.left=`${e.clientX-offsetX}px`;
      el.style.top=`${e.clientY-offsetY}px`;
    }
    function mouseUpHandler(e){
      if(isDragging&&isOverTrash(e.clientX,e.clientY)) {
        el.remove();
        saveNotesToStorage();
      }
      isDragging=false;
      trash.classList.remove('show');
      document.removeEventListener('mousemove',mouseMoveHandler);
      document.removeEventListener('mouseup',mouseUpHandler);
    }
    document.addEventListener('mousemove',mouseMoveHandler);
    document.addEventListener('mouseup',mouseUpHandler);
  });
}

function isOverTrash(x,y){
  const rect=trash.getBoundingClientRect();
  return x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;
}

function openBackgroundModal(){
  document.getElementById('backgroundModal').classList.add('active');
}

function closeModals(){
  document.getElementById('noteModal').classList.remove('active');
  document.getElementById('backgroundModal').classList.remove('active');
}

function changeBackgroundColor(color){
  const isDark=body.classList.contains('dark');
  const finalColor=isDark&&darkModeBackgrounds[color]?darkModeBackgrounds[color]:color;
  body.style.backgroundImage = '';
  body.style.background = color;
  body.classList.remove('has-custom-bg');
  body.classList.add('has-custom-bg');
  closeModals();
}

function setAestheticBackground(theme) {
  const themes = {
    forest: 'url(img/rainy-forest.jpg)',
    beach: 'url(img/beach.jpg)',
    fireplace: 'url(img/fireplace.jpg)'
  };
  const selected = themes[theme];
  if (!selected) return;

  body.classList.add('has-custom-bg');
  body.style.background = 'none';
  body.style.backgroundImage = selected;
  body.style.backgroundSize = 'cover';
  body.style.backgroundPosition = 'center';
  body.style.animation = 'none';
  closeModals();
}

function uploadBackground(event){
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const url = `url(${e.target.result})`;
      body.classList.add('has-custom-bg');

      body.style.background = 'none';
      body.style.animation = 'none';
      body.style.backgroundImage = url;
      body.style.backgroundSize = 'cover';
      body.style.backgroundRepeat = 'no-repeat';
      body.style.backgroundPosition = 'center';
    };
    reader.readAsDataURL(file);
    closeModals();
  }
}

function resetBackgroundToDefault() {
  body.classList.remove('has-custom-bg');
  body.style.background = '';
  body.style.backgroundImage = '';
}

function downloadAsPDF() {
  const editor=document.getElementById("noteEditor");
  const filename=prompt("Enter a name for your PDF file:","MyNote");
  if (!filename) return;
  const wrapper=document.createElement('div');
  wrapper.style.width='100%';
  wrapper.style.display='flex';
  wrapper.style.justifyContent='center';
  wrapper.style.alignItems='center';
  wrapper.style.padding='2cm';
  wrapper.style.boxSizing='border-box';
  wrapper.appendChild(editor.cloneNode(true));
  const opt={
    margin:0,
    filename:filename.trim()+".pdf",
    image:{type:'jpeg',quality:0.98 },
    html2canvas:{
      scale:2,
      useCORS:true,
      backgroundColor:'#ffffff'
    },
    jsPDF:{unit:'cm',format:'a4',orientation:'portrait'}
  };
  html2pdf().set(opt).from(wrapper).save();
}

function toggleDarkMode() {
  body.classList.toggle('dark');
  updateNoteColorsForTheme();
  const toggleInput = document.getElementById('themeToggle');
  if (toggleInput) toggleInput.checked = body.classList.contains('dark');
}

function updateNoteColorsForTheme() {
  const isDark=body.classList.contains('dark');
  const notes=document.querySelectorAll('.note');
  notes.forEach(note=>{
    const currentBg=rgbToHex(window.getComputedStyle(note).backgroundColor).toLowerCase();
    const map=isDark?colorMap:reverseColorMap;
    if (map[currentBg]){
      note.style.backgroundColor=map[currentBg];
      note.style.color=isDark?'#ffffff':'#000000';
    }
  });
}

window.onclick=function(event){
  if(event.target.classList.contains('modal')){
    closeModals();
  }
};

function execCommandWithFocus(command, value = null) {
  const editor = document.getElementById('noteEditor');
  editor.focus();
  document.execCommand(command, false, value);
}

function formatText(command, button) {
  const editor = document.getElementById('noteEditor');
  editor.focus();
  document.execCommand(command, false, null);
  if (document.queryCommandState(command)) {
    button.classList.add('active');
  } else {
    button.classList.remove('active');
  }
}

function formatColor(color) {
  execCommandWithFocus('foreColor', color);
}

function changeFont(font) {
  execCommandWithFocus('fontName', font);
}

function changeFontSize(size) {
  execCommandWithFocus('fontSize', size);
}

function alignText(alignment) {
  execCommandWithFocus(alignment);
}

function clearFormattingStates() {
  const toolbarButtons=document.querySelectorAll('.toolbar button');
  toolbarButtons.forEach(btn=>btn.classList.remove('active'));
  const colorInput=document.querySelector('.toolbar input[type="color"]');
  if (colorInput) {
    const defaultColor=body.classList.contains('dark')?'#ffffff':'#000000';
    colorInput.value=defaultColor;
    execCommandWithFocus('foreColor',defaultColor);
  }
}

function rgbToHex(rgb) {
  const result=rgb.match(/\d+/g);
  if (!result||result.length<3) return rgb;
  return (
    "#"+
    result.slice(0,3)
      .map(x=>parseInt(x).toString(16).padStart(2,'0'))
      .join("")
  );
}

function confirmCloseNote() {
  const editor=document.getElementById('noteEditor');
  const content=editor.innerHTML.trim();
  if (content!==''&&content !=='<br>') {
    const confirmClose=confirm("Discard this note without saving?");
    if (!confirmClose) return;
  }
  editor.innerHTML='';
  editingNote=null;
  closeModals();
}

function togglePin(note) {
  const isPinned=note.classList.toggle('pinned');
  note.style.zIndex=isPinned?'9999':'';
  note.style.cursor=isPinned?'default':'move';
  const pinBtn=note.querySelector('.pin-btn');
  pinBtn.style.opacity=isPinned ? '1':'0.5';
  if (!isPinned) {
    makeDraggable(note);
  }
  saveNotesToStorage();
}

function highlightHashtags(text) {
  return text.replace(/(?<!["=])(#\w+)/g, '<span class="hashtag">$1</span>');
}

function extractTagsFromNote(note) {
  const tags = new Set();
  note.querySelectorAll('.hashtag').forEach(tag => {
    tags.add(tag.textContent);
    tag.addEventListener('click', () => filterByTag(tag.textContent));
  });
  const tagList = document.getElementById('tagList');
  tags.forEach(tag => {
    if (!document.querySelector(`#tagList .tag[data-tag="${tag}"]`)) {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      span.dataset.tag = tag;
      span.onclick = () => filterByTag(tag);
      tagList.appendChild(span);
    }
  });
}

function filterByTag(tag) {
  const tagEl = document.querySelector(`.tag[data-tag="${tag}"]`);
  if (activeTagFilters.has(tag)) {
    activeTagFilters.delete(tag);
    tagEl.classList.remove('active');
  } else {
    activeTagFilters.add(tag);
    tagEl.classList.add('active');
  }
  applyTagFilters();
}

function applyTagFilters() {
  const notes = document.querySelectorAll('.note');

  if (activeTagFilters.size === 0) {
    notes.forEach(note => note.style.display = 'block');
    return;
  }

  notes.forEach(note => {
    const content = note.innerHTML;
    const matches = Array.from(activeTagFilters).some(tag => content.includes(tag));
    note.style.display = matches ? 'block' : 'none';
  });
}

function clearTagFilter() {
  activeTagFilters.clear();
  document.querySelectorAll('.tag').forEach(tag => tag.classList.remove('active'));
  document.querySelectorAll('.note').forEach(note => note.style.display = 'block');
}

function applyTagFilters() {
  const notes = document.querySelectorAll('.note');

  if (activeTagFilters.size === 0) {
    notes.forEach(note => note.style.display = 'block');
    return;
  }

  notes.forEach(note => {
    const content = note.innerHTML;
    const matches = Array.from(activeTagFilters).some(tag => content.includes(tag));
    note.style.display = matches ? 'block' : 'none';
  });
}

function toggleTagDropdown() {
  const dropdown = document.getElementById('tagDropdown');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function manualTagSearch(e) {
  if (e.key === 'Enter') {
    const tag = e.target.value.trim();
    if (tag) filterByTag(tag);
    toggleTagDropdown();
    e.target.value = '';
  }
}

function saveNotesToStorage() {
  const notes = [];
  document.querySelectorAll('.note').forEach(note => {
    notes.push({
      content: note.innerHTML,
      left: note.style.left,
      top: note.style.top,
      width: note.style.width,
      height: note.style.height,
      bgColor: note.style.backgroundColor,
      textColor: note.style.color,
      pinned: note.classList.contains('pinned')
    });
  });
  localStorage.setItem('sticky-notes', JSON.stringify(notes));
}

function loadNotesFromStorage() {
  const stored = localStorage.getItem('sticky-notes');
  const notes = stored ? JSON.parse(stored) : [];

  if (notes.length === 0) {
    // Show default welcome note
    const welcome = document.createElement('div');
    welcome.className = 'note';
    welcome.innerHTML = highlightHashtags("Hey Welcome to notes. Click on the add (+) button to add a new note");

    welcome.style.backgroundColor = getRandomColor();
    welcome.style.color = body.classList.contains('dark') ? '#ffffff' : '#000000';
    welcome.style.width = '240px';
    welcome.style.height = 'auto';
    welcome.style.padding = '1rem';

    // Centered position
    const centerX = window.innerWidth / 2 - 120;
    const centerY = window.innerHeight / 2 - 60;
    welcome.style.left = `${centerX}px`;
    welcome.style.top = `${centerY}px`;

    attachEditButton(welcome);
    makeDraggable(welcome);
    body.appendChild(welcome);
    extractTagsFromNote(welcome);
    return;
  }

  // Otherwise, load saved notes
  notes.forEach(data => {
    const note = document.createElement('div');
    note.className = 'note';
    note.innerHTML = data.content;
    note.style.left = data.left;
    note.style.top = data.top;
    note.style.width = data.width;
    note.style.height = data.height;
    note.style.backgroundColor = data.bgColor;
    note.style.color = data.textColor;

    if (data.pinned) {
      note.classList.add('pinned');
      note.style.zIndex = '9999';
      note.style.cursor = 'default';
    }

    attachEditButton(note);
    makeDraggable(note);
    body.appendChild(note);
    extractTagsFromNote(note);
  });
}

function clearAllNotes() {
  if (!confirm("Are you sure you want to delete all notes?")) return;
  document.querySelectorAll('.note').forEach(note => note.remove());
  localStorage.removeItem('sticky-notes');
}

function applyListStyle(style) {
  currentListStyle = style;
  const editor = document.getElementById('noteEditor');
  editor.focus();
  const lines = editor.innerText.split('\n');
  const formattedLines = lines.map(line => {
    const trimmed = line.trim();

    switch (style) {
      case 'bullet':
        return trimmed.startsWith('•') ? trimmed : `• ${trimmed}`;
      case 'number':
        return /^\d+\./.test(trimmed) ? trimmed : `${lines.indexOf(line) + 1}. ${trimmed}`;
      case 'arrow':
        return trimmed.startsWith('→') ? trimmed : `→ ${trimmed}`;
      case 'checklist':
        return /^\[( |✔)]/.test(trimmed) ? trimmed : `[ ] ${trimmed}`;
      default:
        return line;
    }
  });

  editor.innerHTML = formattedLines.map(line => `<div>${line}</div>`).join('');
}

document.addEventListener('click', function (e) {
  const editor = document.getElementById('noteEditor');
  if (!editor.contains(e.target)) return;
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const container = range.startContainer;
  const line = container.nodeType === 3 ? container.parentElement : container;
  const text = line.innerText.trim();
  if (text.startsWith('[ ]') && range.startOffset <= 3) {
    line.innerText = line.innerText.replace('[ ]', '[✔]');
  } else if (text.startsWith('[✔]') && range.startOffset <= 3) {
    line.innerText = line.innerText.replace('[✔]', '[ ]');
  }
});

document.getElementById('noteEditor').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && currentListStyle) {
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel.rangeCount) return;

      const range = sel.getRangeAt(0);
      const container = range.startContainer;
      const node = container.nodeType === 3 ? container.parentNode : container;

      // Check if we have a valid previous line
      let prevLine = node.previousElementSibling;
      if (!prevLine || !prevLine.innerText) return;

      let prefix = '';
      switch (currentListStyle) {
        case 'checklist':
          prefix = '[ ] ';
          break;
        case 'bullet':
          prefix = '• ';
          break;
        case 'arrow':
          prefix = '→ ';
          break;
        case 'number':
          const match = prevLine.innerText.trim().match(/^(\d+)\./);
          const nextNum = match ? parseInt(match[1]) + 1 : 1;
          prefix = `${nextNum}. `;
          break;
        default:
          return;
      }

      // Only apply if line is empty
      if (node.innerText.trim() === '') {
        node.innerText = prefix;
        const newRange = document.createRange();
        const textNode = node.firstChild;
        if (textNode) {
          newRange.setStart(textNode, prefix.length);
          newRange.setEnd(textNode, prefix.length);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }
    }, 0);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  loadNotesFromStorage();
  const isDark = body.classList.contains('dark');
  const toggleInput = document.getElementById('themeToggle');
  if (toggleInput) toggleInput.checked = isDark;
});