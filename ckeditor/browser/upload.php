<?php
include('../../../defaults.php');

echo '<html><body>';

$file_name = basename($_FILES['upload']['name']);

echo '<script type="text/javascript">';

$file_type = get_file_format($_FILES['upload']['tmp_name']);

if(!BRWeb_Auth_Manager::getInstance()->checkPermission('admin_login')) {
    echo 'window.parent.CKEDITOR.tools.callFunction('.$_GET['CKEditorFuncNum'].', "","Permission denied.");';    
} elseif(!is_writable(PMDROOT.HTMLEDITOR_PATH)) {
    echo 'window.parent.CKEDITOR.tools.callFunction('.$_GET['CKEditorFuncNum'].', "","The '.PMDROOT.HTMLEDITOR_PATH.' folder must have writable permissions.");';
} elseif(in_array($file_type,array('image/jpeg','image/jpg','image/gif','image/png'))) {
    echo 'window.parent.CKEDITOR.tools.callFunction('.$_GET['CKEditorFuncNum'].', "","Invalid file type.  Must be jpg, jpeg, gif or png.");';
} elseif(move_uploaded_file($_FILES['upload']['tmp_name'], PMDROOT.HTMLEDITOR_PATH.$file_name)) {
    echo 'window.parent.CKEDITOR.tools.callFunction('.$_GET['CKEditorFuncNum'].', "'.BASE_URL.HTMLEDITOR_PATH.$file_name.'","File Uploaded!");'; 
} else {
    echo 'window.parent.CKEDITOR.tools.callFunction('.$_GET['CKEditorFuncNum'].', "","Error, please try again!");';
}

echo '</script>';

echo '</body></html>';
?>