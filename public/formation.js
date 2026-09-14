export const normalizeSearch=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export const matchesCatalog=(text,category,query,selected)=> (!selected||category===selected)&&normalizeSearch(query).split(/\s+/).every(term=>normalizeSearch(text).includes(term));
export function initFormation(){
 for(const catalog of document.querySelectorAll('[data-catalog]')){
  const search=catalog.querySelector('[data-catalog-search]'),category=catalog.querySelector('[data-catalog-category]');
  const items=[...catalog.querySelectorAll('[data-catalog-item]')];
  const update=()=>{let count=0;for(const item of items){const show=matchesCatalog(item.textContent,item.dataset.category,search.value,category.value);item.hidden=!show;if(show)count++;}catalog.querySelector('[data-catalog-count]').textContent=`${count} de ${items.length} resultados`;catalog.querySelector('[data-catalog-empty]').hidden=count!==0;};
  search.addEventListener('input',update);category.addEventListener('change',update);catalog.querySelector('[data-catalog-reset]').addEventListener('click',()=>{search.value='';category.value='';update();search.focus();});update();
 }
 const openHash=()=>{const id=decodeURIComponent(location.hash.slice(1));const target=document.getElementById(id);if(target?.matches('.formation-question'))target.open=true;};openHash();window.addEventListener('hashchange',openHash);
}
