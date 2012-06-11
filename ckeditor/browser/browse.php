<?php
include('../../../defaults.php');

$dir = PMDROOT.HTMLEDITOR_PATH;
$files = array();
echo '<html><body>';

if(is_dir($dir)) {
    if ($dh = opendir($dir)) {
        while (($file = readdir($dh)) !== false) {
            if($file != '.' AND $file != '..' AND in_array(get_file_extension($file),array('jpeg','jpg','png','gif'))) {
                $files[] = $file;
            }
        }
        closedir($dh);
    }
}
if(count($files)) {
    echo 'Files:<br />';
    foreach($files AS $file) {
        echo '<a onclick="window.opener.CKEDITOR.tools.callFunction('.$_GET['CKEditorFuncNum'].',\''.BASE_URL.HTMLEDITOR_PATH.$file.'\'); window.close();" href="#">'.$file.'</a><br />';   
    }
} else {
    echo 'No files available.  Please use the upload feature if available.';
}

echo '</body></html>';
?>