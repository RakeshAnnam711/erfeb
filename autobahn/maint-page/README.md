# RVW Autobahn - Custom Maintenance Page

Custom Maintenance Page

- Change folder name 'www.autobahn.com' to URL of current site.
- Update content in www.SITENAME.com > index.html:

	- Find + replace __Autobahn__ with brand's name
	- Update email + phone

- Replace logo.png
- Zip folder www.SITENAME.com

**Compressing a folder on a MAC will add .DS_STORE use either a zipp app like BetterZip or zip via command line example:* 

```
cd data/maint-page
zip -vr archive.zip www.SITENAME.com -x "*.DS_Store"
```

- Upload archive.zip to Administration > Site Development > Custom Maintenance Pages in Business Manager