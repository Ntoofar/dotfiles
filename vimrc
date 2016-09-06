" Note: Skip initialization for vim-tiny or vim-small.
 if 0 | endif

 if has('vim_starting')
   if &compatible
     set nocompatible               " Be iMproved
   endif

   " Required:
   set runtimepath+=~/.vim/bundle/neobundle.vim/
 endif

 " Required:
 call neobundle#begin(expand('~/.vim/bundle/'))

 " Let NeoBundle manage NeoBundle
 " Required:
 NeoBundleFetch 'Shougo/neobundle.vim'

 " nerdtree
 NeoBundle 'scrooloose/nerdtree'

 " solarized color theme
 NeoBundle 'altercation/vim-colors-solarized'
 NeoBundle 'tpope/vim-fugitive'
 NeoBundle 'scrooloose/syntastic'
 NeoBundle 'Valloric/YouCompleteMe'
 NeoBundle 'vim-airline/vim-airline-themes'
 NeoBundle 'vim-airline/vim-airline'

 " My Bundles here:
 " Refer to |:NeoBundle-examples|.
 " Note: You don't set neobundle setting in .gvimrc!

 call neobundle#end()

 " config mapleader key
 let mapleader="\<Space>"

 " config vim-color-solarized
 syntax enable
 syntax on
 "let g:solarized_termcolors=256
 set background=dark
 colorscheme solarized

 " config scrooloose/nerdtree
 autocmd vimenter * NERDTree
 autocmd StdinReadPre * let s:std_in=1
 autocmd VimEnter * if argc() == 0 && !exists("s:std_in") | NERDTree | endif
 map <C-n> :NERDTreeToggle<CR>
 autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif

 " config tpope/vim-fugitive
 autocmd QuickFixCmdPost *grep* cwindow

 " config scrooloose/sntastic
 set statusline+=%#warningmsg#
 set statusline+=%{SyntasticStatuslineFlag()}
 set statusline+=%*

 let g:syntastic_always_populate_loc_list = 1
 let g:syntastic_auto_loc_list = 1
 let g:syntastic_check_on_open = 1
 let g:syntastic_check_on_wq = 0

 " config YouCompleteMe
 let g:ycm_global_ycm_extra_conf = '/Users/Ntoofar/.ycm_extra_conf.py'
 let g:ycm_python_binary_path = '/usr/local/bin/python3'
 autocmd InsertLeave * if pumvisible() == 0|pclose|endif 
 autocmd CursorMovedI * if pumvisible() == 0|pclose|endif

 " config vimr-airline
 " set status line
 set laststatus=2
 " enable powerline-fonts
 let g:airline_powerline_fonts = 1

 " enable tabline
 let g:airline#extensions#tabline#enabled = 1
 " set left separator
 let g:airline#extensions#tabline#left_sep = ' '
 " set left separator which are not editting
 let g:airline#extensions#tabline#left_alt_sep = '|'
 " show buffer number
 let g:airline#extensions#tabline#buffer_nr_show = 1
 
 " set number
 set relativenumber
 function! NumberToggle()
   if(&relativenumber == 1)
     set norelativenumber
     set number
   else
     set nonumber
     set relativenumber
   endif
 endfunc

 nnoremap <leader>nt :call NumberToggle()<cr>

 au BufNewFile,BufRead *.py
 \ set tabstop=4 |
 \ set softtabstop=4 |
 \ set shiftwidth=4 |
 " \ set textwidth=79 |
 \ set expandtab |
 \ set autoindent |
 \ set fileformat=unix

 " config for different file type
 au BufNewFile,BufRead *.js, *.html, *.css
 \ set tabstop=2 |
 \ set softtabstop=2 |
 \ set shiftwidth=2

 " find reduntant white space charater
 highlight BadWhitespace ctermbg=red guibg=red
 au BufRead,BufNewFile *.py,*.pyw,*.c,*.h match BadWhitespace /\s\+$/

 " config for backspace work in insert mode
 set backspace=2 " make backspace work like most other apps
 set backspace=indent,eol,start

 " Required:
 filetype plugin indent on

 " If there are uninstalled bundles found on startup,
 " this will conveniently prompt you to install them.
 NeoBundleCheck
