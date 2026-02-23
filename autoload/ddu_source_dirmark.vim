" ddu-source-dirmark autoload functions

" Set the directory where dirmark data is stored.
" By default, data is stored in ~/.cache/ddu-source-dirmark/.
"
" Example:
"   call ddu_source_dirmark#set_data_directory_path('~/.local/share/dirmark')
function! ddu_source_dirmark#set_data_directory_path(path) abort
  let g:ddu_source_dirmark_data_dir = expand(a:path)
endfunction
